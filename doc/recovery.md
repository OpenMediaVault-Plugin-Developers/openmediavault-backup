# OpenMediaVault Backup &amp; Recovery Guide

This guide covers the **openmediavault-backup** plugin end to end: how backups
are made, what each backup contains, and — most importantly — how to **restore**
a system, including the helper tooling and the *Recovery USB* feature.

> **The one thing to understand first:** a restore **cannot** run from inside a
> running OpenMediaVault. A restore overwrites, byte for byte, the disk the OS
> boots from — you cannot do that while that disk is mounted and in use, for the
> same reason you cannot replace a car's engine while driving it. **Backups run
> from inside the system; restores run from outside it** (a live/rescue USB).
> Everything below is built around that fact.

---

## 1. Concepts at a glance

| Term | Meaning |
|------|---------|
| **Backup set** | All files produced by one backup run, sharing a timestamp `YYYY-MM-DD_HH-MM-SS`. |
| **Backup method** | How the OS is captured: `dd`, `ddfull`, `fsarchiver`, `borg`, or `rsync`. |
| **Manifest** | A machine-readable description of the disk layout, written with every backup. |
| **Restore helper** | `omv-restore-helper`, copied into every backup folder; performs/guides restores. |
| **Recovery USB** | A removable stick carrying a backup set + helper + manifest + README. |

---

## 2. The Backups page (Web UI → System → Backup)

**System → Backup** opens the **Backups** page: a table of the backups currently
stored (newest first) with their method and size. For `borg` the rows are the
archives in the repository (orphaned sidecar metadata is not listed); for the
other methods they are the dated backup sets. Its toolbar provides:

- **Backup** — run a backup now (in a task dialog).
- **Info** — details for the selected backup (`borg info`, or its manifest and files).
- **Recovery USB** — write the selected backup to a removable stick ([section 7](#7-recovery-usb)).
- **Delete** — remove the selected backup(s) (the `borg` archive and its sidecar
  files, or the dated archive files).
- **Purge** — keep only the most recent *X* backups and delete the rest. The
  scheduled backup already prunes old backups when it finishes, but if the
  destination fills up that step never runs — Purge reclaims space on demand.
  (`borg` is pruned and compacted, and sidecar metadata older than the oldest
  kept archive is removed; `rsync` keeps a single mirror, so there is nothing
  to purge.)
- **Settings** / **Schedule** — open the configuration forms.
- **Fix cron** — rebuild the scheduled job if it was lost.

### Settings (Web UI → System → Backup → Settings)

| Field | Notes |
|-------|-------|
| **Shared folder** | Where backups are written. A `omvbackup` subfolder is created inside it. |
| **Method** | See [section 3](#3-backup-methods). |
| **Root device** | *Advanced.* Leave blank to auto-detect. Only set if auto-detection fails. |
| **Extra options** | Passed to the backup tool (e.g. extra `--exclude=` paths for rsync/borg/fsarchiver). |
| **Keep** | Days of backups to retain (auto-purged with `find -mtime` after each run). `0` disables purging. |
| **Password** | If set, encrypts `fsarchiver`/`borg` archives (6–64 chars). |
| **Verbose output** | More detail in the log / progress. |

The backup log is at `/var/log/omv-backup.log`.

---

## 3. Backup methods

| Method | Produces | Best for | Restore difficulty |
|--------|----------|----------|--------------------|
| **dd** | Compressed image of the **OS partition** (`.dd.zst`), plus boot/ESP partition images where present. | General use; fast restore. | Easy (needs partition table restore first). |
| **ddfull** | Compressed image of the **entire OS disk** (`.ddfull.zst`) — partition table, bootloader and all partitions in one file. | **SBC / Raspberry Pi**, and anyone who wants the simplest possible restore. | Easiest — one image, bootable as written. |
| **fsarchiver** | Filesystem-level archive (`.fsa`). Can be encrypted; filesystem-aware (can restore to a different partition size). | Flexible restores, encryption. | Moderate. |
| **borg** | Deduplicated, incremental repository (`borgbackup/`). Can be encrypted. | Space-efficient history, file-level recovery. | Advanced (file-level; manual partition/format). |
| **rsync** | A plain file tree mirrored into the backup folder. | Browsing/selective file recovery. | Advanced (manual partition/format/bootloader). |

### Files written in a backup set

Depending on method and hardware, a set `backup-omv-<date>.*` may include:

- `*.dd.zst` — OS/root partition image · `*_boot.dd.zst` — `/boot` partition · `*.espdd.zst` — EFI System Partition
- `*.ddfull.zst` — full-disk image
- `*.fsa` — fsarchiver archive
- `*.fdisk`, `*.blkid` — partition layout and UUIDs (human-readable)
- `*.sgdisk` (GPT) or `*.sfdisk` (MBR) — restorable partition table
- `*.grub` (MBR bytes), `*.grubparts` (MBR + partition table)
- `*_u-boot.tar.zst` — u-boot (ARM/SBC boards)
- `*.packages` — installed OMV package list
- **`*.manifest`** — machine-readable layout (see below)
- **`RESTORE-README.txt`** — a generated, machine-specific restore guide
- **`omv-restore-helper`** — the restore tool, copied in for convenience

---

## 4. The manifest

Every backup writes `backup-omv-<date>.manifest`: a flat, grep-parseable
`key="value"` file (do **not** `source` it). It records exactly what a restore
needs so the tooling never has to *guess* the layout:

```
manifest_version="1"
method="dd"
arch="x86_64"
board_model=""           # /proc/device-tree/model on SBCs
uboot_present="0"        # 1 on u-boot/SBC systems (no GRUB step needed)
root_disk="/dev/sda"
root_fs_device="/dev/sda2"
root_fs_uuid="...."
part_type="gpt"          # gpt or dos(MBR)
part_letter=""           # "p" for nvme/mmcblk source devices
esp_part_number="1"
boot_device="/dev/sda3"
file_dd="backup-omv-....dd.zst"   # which artifacts exist
...
```

Older backups made before this feature have **no** manifest; the tooling
degrades gracefully (it infers what it can and falls back to placeholders).

---

## 5. The restore helper (`omv-restore-helper`)

Copied into every backup folder. Run it from a **live/rescue environment**, in
the folder that holds the backups. Two ways to use it:

### Interactive menu

```bash
sudo ./omv-restore-helper
```

```
1) List available backups
2) Verify backup integrity
3) Show backup metadata
4) Guided restore (automatic)
5) Generate restore commands (manual)
6) Compare with current system
7) Extract backup for browsing
8) Quick reference guide
9) Exit
```

### Command line

```bash
sudo ./omv-restore-helper [--dry-run] <command> [args]

  list      [dir]                 # list backup sets
  verify    [dir] <date>          # zstd-test the compressed images
  metadata  [dir] <date>          # show fdisk/blkid/sfdisk/packages
  auto      [dir] <date> [device] # GUIDED automatic restore (executes!)
  restore   [dir] <date> [device] # print manual restore commands
  readme    [dir] [date] [out]    # (re)write RESTORE-README.txt
  compare   [dir] <date>          # compare backup vs current system
  extract   [dir] <date>          # loop-mount a dd image to browse files
  help
```

### Guided automatic restore (the easy path)

```bash
sudo ./omv-restore-helper auto
```

It lists your backups, lets you pick a target disk (`lsblk`), reads the manifest
to determine the exact layout, asks you to **type the target device path to
confirm**, then runs every step itself. Preview without touching anything:

```bash
sudo ./omv-restore-helper --dry-run auto
```

**Safety built in:** it refuses the disk the live system booted from, refuses a
target with mounted partitions, and requires explicit confirmation. It handles
`ddfull`, `dd` and `fsarchiver`. `borg`/`rsync` fall back to printed guidance.
`ddfull` works even without a manifest; `dd`/`fsarchiver` require one (so it
never guesses partition numbers).

The helper also fixes two long-standing manual-restore pitfalls automatically:
NVMe/eMMC partition naming (`nvme0n1p2`, not `nvme0n12`) and the real ESP
partition number (no more `<ESP_NUM>` placeholder).

---

## 6. RESTORE-README.txt

Generated into the backup folder on every run. It contains the "why you can't
restore from OMV" explanation, this machine's captured layout, the **guided**
command, **manual** commands for that set's method (with real partition numbers
when a manifest exists), and a Raspberry Pi / SBC note. Regenerate any time:

```bash
sudo ./omv-restore-helper readme . <date>
```

---

## 7. Recovery USB

Reached from the **Backups** page: select a backup row, then click **Recovery
USB**. This builds a **recovery bundle** on a removable stick: the chosen backup
set + the helper + the manifest + the README. It can run **while OMV is live**
because it writes to a *USB stick*, not the system disk.

**Fields:** target device (only removable/USB disks are listed), filesystem
(`ext4` or `exfat`), volume label. The backup set is the row you selected.
**Pressing "Prepare recovery USB" ERASES the selected device.**

**Safety:** the backend (`omv-backup-recovery-usb`) only accepts removable/USB
whole disks, refuses the system and backup disks, checks the device is large
enough, and partitions/formats fresh.

**Why `exfat`?** It's readable on Windows/macOS too, which is handy for the SBC
workflow below (writing an image from a laptop). `ext4` is the default for a
Linux-only workflow.

The stick is a **data bundle, not bootable** (see [section 9](#9-making-an-amd64-bootable-rescue-usb)).
To use it: boot a live/rescue system, open the stick, and run
`sudo ./omv-restore-helper auto`.

You can also run it from the shell:

```bash
omv-backup-recovery-usb --device /dev/sdX --date <date> --filesystem ext4
omv-backup-recovery-usb --list-devices    # JSON, as the GUI sees them
omv-backup-recovery-usb --list-backups
```

---

## 8. Restore walk-throughs

In all cases: **boot a live/rescue Linux**, make the backup folder available
(the stick, or mount the backup share), `cd` into it, then either run
`sudo ./omv-restore-helper auto` or follow the manual steps below. Identify
disks with `lsblk` first. `<TARGET>` = the destination whole disk.

### 8a. Full-disk image (`ddfull`) — easiest

```bash
zstd -d -c backup-omv-<date>.ddfull.zst | dd of=<TARGET> bs=4M status=progress
sync
```
Partition table and bootloader are included — the disk boots as written.

### 8b. Partition image (`dd`)

```bash
# 1. partition table
sgdisk --load-backup=backup-omv-<date>.sgdisk <TARGET>   # GPT
# (or)  sfdisk <TARGET> < backup-omv-<date>.sfdisk        # MBR
# 2. root partition  (partition number from the manifest)
zstd -d -c backup-omv-<date>.dd.zst   | dd of=<TARGET>2 bs=4M status=progress
# 3. boot partition (if present)
zstd -d -c backup-omv-<date>_boot.dd.zst | dd of=<TARGET>3 bs=4M status=progress
# 4. ESP (if present)
zstd -d -c backup-omv-<date>.espdd.zst | dd of=<TARGET>1 bs=4M status=progress
sync
```
> Partition naming: SATA/USB → `sdb1`; **NVMe/SD/eMMC → `nvme0n1p1`, `mmcblk0p1`**.
> The `auto` mode gets this right for you.

UUIDs are preserved (block-level copy), so `/etc/fstab` needs no changes.

### 8c. fsarchiver

```bash
sgdisk --load-backup=backup-omv-<date>.sgdisk <TARGET>     # restore table first
fsarchiver restfs backup-omv-<date>.fsa id=0,dest=<TARGET>2   # root
fsarchiver restfs backup-omv-<date>.fsa id=1,dest=<TARGET>3   # boot (if present)
```
You're prompted for the password if the archive is encrypted.

### 8d. borg / rsync (file-level)

Partition and format the target yourself, mount it, then:

```bash
# borg
borg extract ./borgbackup::backup-omv-<date> --target /mnt/target
# rsync
rsync -aAXv ./ /mnt/target/ --exclude='/lost+found'
```
Then fix `/etc/fstab` UUIDs and reinstall the bootloader (see section 10).

### 8e. Raspberry Pi / SBC (ARM)

There is **no universal ARM rescue USB** — each board boots its own way
(Pi firmware, or board-specific u-boot at fixed offsets). The simplest recovery
is **off-board**: take a `ddfull` backup to *any* computer and write it to a
fresh SD card / USB. The copy is architecture-independent (just bytes):

```bash
zstd -d -c backup-omv-<date>.ddfull.zst | sudo dd of=<TARGET> bs=4M status=progress
```
u-boot is contained in the image, so the card boots with no extra steps — no
GRUB, no chroot. This is why **`ddfull` is recommended for SBCs**, and why the
Recovery USB can use `exfat` (so you can read the stick on a Windows/Mac laptop
to do this write).

---

## 9. Making an amd64 bootable rescue USB

The Recovery USB feature produces a **data bundle**, not a bootable stick — it
deliberately does not ship a ~1 GB live OS inside the plugin package. On amd64
you supply the bootable part once, using a standard rescue distribution.
Recommended: **[SystemRescue](https://www.system-rescue.org/)** — it boots BIOS
**and** UEFI, and already includes every tool a restore needs (`zstd`, `dd`,
`gdisk`, `parted`, `fsarchiver`, `rsync`, …).

Two simple options:

**Option A — two sticks (simplest).**
1. Write the SystemRescue ISO to one USB with any imager (`dd`, balenaEtcher,
   Rufus, etc.) — it is isohybrid, so this "just works".
2. Use the plugin's **Recovery USB** to put the backup bundle on a second stick.
3. Boot SystemRescue, plug in the bundle stick, `cd` to it, run
   `sudo ./omv-restore-helper auto`.

**Option B — one stick (bootable + bundle).**
1. Write the SystemRescue ISO to a large USB.
2. After the ISO's own partitions there is unused space; create one more
   partition there and format it:
   ```bash
   sgdisk --new=0:0:0 --typecode=0:8300 /dev/sdX   # uses the trailing free space
   partprobe /dev/sdX
   mkfs.ext4 -L OMVRECOVERY /dev/sdXN
   ```
3. Mount it and copy the bundle onto it (the same files the Recovery USB writes:
   the `backup-omv-<date>.*` set, `omv-restore-helper`, the manifest, the README).
4. Boot the stick, open that partition, run `sudo ./omv-restore-helper auto`.

> On Raspberry Pi / SBC, **do not** look for a bootable rescue stick — use the
> off-board `ddfull` write in [section 8e](#8e-raspberry-pi--sbc-arm) instead.

---

## 10. Post-restore steps

- **`dd` / `ddfull`**: UUIDs are preserved, so `/etc/fstab` is fine.
- **fsarchiver / borg / rsync**: verify `/etc/fstab` UUIDs against `blkid`.
- **Bootloader:**
  - **u-boot / SBC**: nothing to do — it travels with the image.
  - **`ddfull`**: nothing to do — the bootloader is in the image.
  - **Partition / file-level on x86**: reinstall GRUB:
    ```bash
    mount <TARGET>2 /mnt/target
    for d in dev proc sys; do mount --bind /$d /mnt/target/$d; done
    chroot /mnt/target grub-install <TARGET>
    chroot /mnt/target update-grub
    umount -R /mnt/target
    ```
- Remove the rescue medium and reboot.

---

## 11. Common pitfalls

- ✗ Wrong device name (`sda` vs `nvme0n1`) — always check with `lsblk` first.
- ✗ Forgetting the `p` in NVMe/SD/eMMC partition names — use `auto` mode.
- ✗ Restoring to a disk **smaller** than the source.
- ✗ Interrupting a `dd`/`zstd` stream.
- ✗ Expecting a restore to run from the OMV web UI — it cannot; boot a rescue env.

---

## 12. Dependencies

The plugin depends on: `zstd`, `fdisk`, `gdisk`, `parted`, `fsarchiver`,
`borgbackup`, `rsync`, `exfatprogs`. A rescue environment used for restoring
needs the equivalents (SystemRescue ships them all).

---

## See also

- `doc/restore_dd.md` — a focused walk-through of restoring a `dd`/`ddfull` image.
- `doc/zstd.md` — notes on the zstd compression options.
