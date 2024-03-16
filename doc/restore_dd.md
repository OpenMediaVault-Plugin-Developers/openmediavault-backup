# How to restore dd and ddfull image

## Identify your drive or partition

They are multiples way to identify your drive or partition, I'm going to explain a few one, fell free to use the one you fell the most confident with.

> Remember that you can use the tabulation key to autocomplete path, and the control+c combination to blank your current command. Fell free to try using them beforehand.

### By label

Each disk (and partitions) have a different label which is constituted by is connection type (ata, scsi, ...), model, serial number and partition number. It is probably the easiest way if you know or can read the label on the top of your drive.

We are going to store it inside a variable for later usage (you can memorize it if you prefer).

```bash
SOURCE=/dev/disk/by-id/ata-ST2000DL003-9VT166_5YD2W75Z
```

#### For partition

If you want to work with partition, and if you know the partition number, you can use the last command and add the partition number directly.

```bash
SOURCE=/dev/disk/by-id/ata-ST2000DL003-9VT166_5YD2W75Z-part1
```

If you don't know it's number, you can list them with `fdisk -l`.

```bash
root@omv-dev:~# fdisk -l $SOURCE
Disk /dev/sdb: 50 GiB, 53687091200 bytes, 104857600 sectors
Disk model: Virtual Disk
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disklabel type: gpt
Disk identifier: 88992846-D209-4046-84ED-1C4DC53ACDC8

Device     Start       End   Sectors Size Type
/dev/sdb1   2048 104857566 104855519  50G Linux filesystem
```

### For the target

Now you can repeat the previous step but for the target drive.

```bash
TARGET=/dev/disk/by-id/ata-ST2000DL003-9VT166_5YD354DB-part2
```

## Prepare and locate your backup

### Create a directory for mounting the source

We create a directory to mount our source first.

```bash
mkdir /source
```

### Mount the source filesystem

We mount our source

```bash
mount $SOURCE /source
```

### Locate your backup folder

> Remember again about the tab key for autocompletion.

Move to your folder holding your backup.

```bash
cd /source/backup/omvbackup
```

## Restore

> **Double check your command before launching it, after it is launched they're NO WAY TO UNDO IT!**

Launch the restore process with the backup of your choice.

```bash
zstdcat ./backup-omv-2023-04-23_11-20-11.dd.zst >$TARGET
```

When the prompt appear again, the copy is complete.

If an error is trow, you can try launching the restore again with dd.

```bash
zstdcat /backup-omv-2023-04-23_11-20-11.dd.zst | dd bs=1M iflag=fullblock of=$TARGET status=progress
```
