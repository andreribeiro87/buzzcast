# Changelog

All notable changes to BuzzCast. Versions follow the `BuzzCast v<x.y>` releases.

## v1.4

### New

- **RPCS3 (PS3) support** — the host's **Emulator Instructions** popup (formerly "PCSX2 Instructions") now has **PCSX2** and **RPCS3** tabs with the setup steps for each. RPCS3 supports up to 7 Buzz! players (the PS3 has 7 controller ports).

### Fixes

- **Buttons now register in-game.** The emulator picked up the keys on its mapping screen, but presses were ignored during the game. BuzzCast released each key <1 ms after pressing it, while PCSX2 and RPCS3 read the Buzz! pad as a level every few ms / once per frame — so almost every tap fell between two reads (measured: 2 of 20 taps seen at 60 fps, 0 of 20 at 30 fps). Keys are now held down for ~80 ms, like a quick real tap (20 of 20 seen); the press itself is still sent instantly, so buzz-in order is unchanged.
- **Keybinds now actually save** in the downloadable app — they were lost on restart because the compiled binary tried to write inside its own read-only bundle. Keybinds and the downloaded `cloudflared` now live in a per-user folder (`%LOCALAPPDATA%\BuzzCast`, `~/Library/Application Support/BuzzCast`, `~/.local/share/buzzcast`). Saving shows an error if it ever fails.
- **Cloudflare Install button fixed** in the downloadable app (same cause). A `cloudflared` placed next to the executable is also picked up.
- **Uninstall cloudflared fixed on Windows** — it now stops the tunnel before deleting the file (Windows can't delete a running `.exe`). Closing BuzzCast also stops the tunnel.
- **Host controls are host-only** — the Host page, Keybinds, Install/Uninstall and Shut down only answer requests from the PC running BuzzCast, so remote players can't close the game or change keys through the tunnel link.
- **Wake lock on iPhone** — re-requested on every button tap/release, since iOS only grants it from a user gesture.
- Fixed the GitHub link on the lobby and host pages.

## v1.3

- **Screen wake lock** — the controller keeps the phone's screen awake while playing (re-acquired automatically when you switch back to the tab).
- **Auto-update notifications** — the host checks GitHub for newer releases and shows a dismissible banner with a download link (EN/PT).

## v1.2

- **Cross-platform** — now builds for **Windows, macOS and Linux** from one codebase, with the OS-specific keyboard backend selected at runtime. CI builds all three on each tagged release (Linux AppImage + macOS `.app` included).
- **Antivirus false-positive fixed** — keyboard injection moved from PowerShell `Add-Type` (which dropped a random unsigned DLL in `%TEMP%`) to direct `bun:ffi` calls into the signed system library. No temp DLL, no subprocess, lower latency.
- **Keybinds menu** — change any pad's key from a host popup, test each button live, and the mapping is saved across runs.
- **Instructions revamp** — PCSX2 setup is now an in-app popup on the host; the player page is focused on how to join and play.
- Project reorganised into `src/` · `legacy/` · `scripts/` · `assets/` · `public/`.

> ⚠️ The **macOS and Linux** builds compile and ship but haven't been verified on real hardware yet — [feedback welcome](https://github.com/bacoinz/buzzcast/issues). Linux is X11-only (needs `libxtst6`); macOS needs Accessibility permission and is unsigned.

## v1.1

- Fixed the key map for players 6, 7 and 8.
- Lower-latency input and a live per-player latency indicator.
- Auto-reconnect with exponential backoff when WiFi drops.

## v1.0

- Initial release — up to 8 phone controllers for PCSX2, local play and remote play via Cloudflare Tunnel.
