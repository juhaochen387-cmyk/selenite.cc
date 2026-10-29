# Selenite offline adaptation

[Download the full offline package from Releases](https://github.com/juhaochen387-cmyk/selenite.cc/releases/latest) · [Build status](https://github.com/juhaochen387-cmyk/selenite.cc/actions/workflows/offline-package.yml)

The full package includes **427 game entries and 15 app entries**, local assets, browser-readable data bundles, and optional no-install Windows/Mac/Linux launchers. The release is about **8.4 GB compressed / 12 GB extracted** and is published in five parts because of GitHub's file limits. Follow the joining instructions in the release, extract it completely, then open `index.html`.

If the first release is still building, the build-status link shows its progress. A successful run publishes the complete download automatically.

## What this repository contains

This repository contains the editable application, fonts and runtime libraries, source for the optional local launcher, recorded verification results, and the package-building tools. The game/app binaries are distributed in Releases rather than regular Git commits.

**GitHub's “Code → Download ZIP” is the application source, not the complete game library.** Use the Release download for the prepared offline copy. To prepare the library from a source checkout yourself, install Python 3 and Git, then run `python3 tools/prepare-library.py` once while online. This downloads the pinned public mirror (several GB) and creates the local data bundles. There is no build step after setup: open `index.html`, or run the included launcher if an engine requires HTTP.

## Limits

This is **not a verified exact snapshot of today's live site**. The uploaded ZIP was missing its catalog, game files, thumbnails and main site pages. Frontend text was recovered from the current public code viewer; the complete available game/app library comes from the public mirror at commit `5310d925eb6e1d6b5fec23a8b2e3cf77bc163f22` (March 6, 2025). Catalog details and content can differ from today's site.

Online accounts, profiles, friends, live rankings, multiplayer servers, weather and proxy services require their original online servers. Some games retain missing dependencies or engine requirements. All catalog entry points are present; gameplay was not exhaustively verified.

Core browser checks passed with outside requests blocked: navigation, catalog/search/empty states, favorites, sorting, themes/custom colors, hidden games and 2048 gameplay. Ruffle Minesweeper, Unity Slope and Cookie Clicker were exercised through the local data layer. Direct `file://` opening was subsequently verified in standard Chrome on a GitHub runner: navigation, favorites, cross-page settings persistence, 2048 gameplay and Ruffle Flash loading passed with no page errors or outside requests. See [direct HTML verification](verification/direct-html-test.json) and the [successful browser run](https://github.com/juhaochen387-cmyk/selenite.cc/actions/runs/40791547271). Other browsers/platforms were not exhaustively tested. Linux launcher tested; Windows/Mac binaries cross-compiled.

Read [READ-ME-FIRST.md](READ-ME-FIRST.md) for running instructions, sources and complete verification limits. Original game/library license files are retained where supplied.
