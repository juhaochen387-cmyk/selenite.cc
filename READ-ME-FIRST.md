# Selenite offline adaptation

Extract the entire ZIP, then open **index.html** in a desktop browser. Keep all folders together. Do not open the HTML from inside the ZIP.

The website files need no build step. The package includes the current frontend pages recovered from the public code viewer, the supplied games-page scripts and styles, and all game/app files from the accessible source mirror: **427 game entries and 15 app entries**. The extracted folder needs about 12 GB of space.

## For games that require HTTP

Some browser engines need HTTP, workers, or cross-origin isolation even when all their files are local. Use the included launcher for your computer:

- Windows: `Start Selenite - Windows.exe`
- Mac: `Start Selenite - Mac.command`, or the matching Apple Silicon/Intel executable
- Linux x64: `Start Selenite - Linux` or its `.sh` wrapper

These launchers need no Python or Node installation. They serve only this folder on your computer at `http://127.0.0.1:4173/index.html` and open your browser. Keep the launcher running while playing. Close its terminal window to stop it. On Mac/Linux, preserve executable permissions when extracting; if necessary, run `chmod +x "Start Selenite - "*` in the extracted folder.

Browser saves belong to the browser and its origin. Keep using the same browser and launch method/port to retain favorites, settings and game saves. File mode and launcher mode can have separate storage. Settings includes a backup download/upload feature.

## What is incomplete

**This is not a verified, completely matching snapshot of the live site.**

The uploaded 20 KB ZIP contained only `projects.html`, three scripts, three stylesheets, a favicon and crawler/Cloudflare files. It contained no game catalog, game files, thumbnails, home page, sidebar, settings page or player page.

The current site and source host were blocked for direct downloads by this execution environment's network policy. Frontend text was recovered through the public code viewer. The game catalog and complete available game directories were recovered from the older public mirror, commit `5310d925eb6e1d6b5fec23a8b2e3cf77bc163f22` (March 6, 2025). Its catalog order, available titles, tags, thumbnails and content may differ from today's site. Missing original sidebar icons were replaced with local Material icons.

Accounts, profiles, friends, live rankings, online multiplayer, weather and proxy services require online servers and are unavailable offline. Site ads and analytics were removed; some games retain network calls from their original engines. Some games contain stale links, missing external dependencies, or engine requirements; their functionality is not guaranteed. Flash games use a bundled Ruffle release, whose compatibility varies by game. Larger titles may need the optional launcher.

`OFFLINE-STATUS.json` records entry-point availability and which 347 game/app directories have browser-readable data bundles. This is an asset inventory, not a claim that every title was tested. `MISSING-REMOTE-DEPENDENCIES.json` lists unresolved library downloads. An exact current copy requires the complete current frontend and resource archive. Online services cannot behave identically without their servers.

## Verification

Browser checks passed with external requests blocked: home/sidebar navigation, catalog loading, search and empty states, favorites, sorting controls, themes and custom colors, hidden games, 2048 gameplay, and creation of a Flash player through bundled Ruffle. The Linux launcher was also exercised. Windows and Mac launchers were cross-compiled but not run here.

This environment's browser policy blocks `file://` navigation. Direct HTML opening was therefore not browser-verified here; the data bundles and relative file paths were prepared for it. The launcher route was browser-verified. The data-bundle path was also exercised over HTTP for Minesweeper, Slope and Cookie Clicker, with outside requests blocked; this checks the compatibility layer but does not establish file-scheme browser behavior. See `verification/` for the recorded results and limits.

## Sources

- Supplied archive: `archive_name (1).zip`
- Current frontend: https://git.ceres.rip/selenite/frontend (main at `3781b08108`)
- Game/app source mirror: https://gitlab.com/skysthelimit.dev/selenite
- Ruffle: https://ruffle.rs/ (package `@ruffle-rs/ruffle` 0.7.1)
- Font: Mulish; icons: Google Material Design Icons

Original game/library license files are retained where present. The launcher source is in `source-adaptation/server.go`. All HTML, JavaScript, styles and assets are directly editable.
