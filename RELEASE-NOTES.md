# Selenite offline adaptation

Download **all five** `selenite-offline.zip.00N` parts from this release, plus `SHA256SUMS`. Keep the parts in the same folder. They form one ZIP archive and are not independent ZIP files.

Windows Command Prompt:

```bat
copy /b selenite-offline.zip.001+selenite-offline.zip.002+selenite-offline.zip.003+selenite-offline.zip.004+selenite-offline.zip.005 selenite-offline.zip
```

Mac/Linux:

```sh
cat selenite-offline.zip.00* > selenite-offline.zip
```

Extract the resulting ZIP completely, then open `selenite-offline/index.html`. Keep all folders together. Optional Windows/Mac/Linux local launchers are included for engines that require HTTP. No Node or Python installation is needed to use the completed download.

The full package is about 8.4 GB compressed and 12 GB extracted. Allow space for the parts, joined ZIP, and extracted folder while preparing it.

This is an offline adaptation, **not a verified exact/current copy**. It includes 427 game entries and 15 app entries recovered from the March 2025 public mirror. Live services and some games cannot work offline. Direct HTML opening, navigation, cross-page storage, 2048 gameplay and Ruffle SWF loading passed on a standard Chrome runner with no outside requests. Core HTTP behavior and representative game engines were also tested with outside requests blocked. Read `READ-ME-FIRST.md` for the full verification limits.
