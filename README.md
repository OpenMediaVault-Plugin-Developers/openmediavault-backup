openmediavault-backup
=====================

A plugin to back up the OpenMediaVault system disk (OS), so it can be restored
after a disk failure or a bad upgrade. Supports `dd`, full-disk `dd`,
`fsarchiver`, `borgbackup` and `rsync` methods.

> A restore cannot run from within OpenMediaVault — it overwrites the disk the
> OS boots from. Restores run from a live/rescue environment. Every backup
> includes a restore helper, a layout manifest and a generated README to make
> that as easy as possible.

Documentation
-------------

- **[doc/recovery.md](doc/recovery.md)** — comprehensive backup &amp; recovery guide:
  configuration, what each backup contains, the manifest, the `omv-restore-helper`
  (including the guided automatic restore), the **Recovery USB** feature, restore
  walk-throughs per method, the Raspberry Pi / SBC workflow, and how to make an
  amd64 bootable rescue USB.
- [doc/restore_dd.md](doc/restore_dd.md) — focused `dd`/`ddfull` restore walk-through.
- [doc/zstd.md](doc/zstd.md) — zstd compression options.
