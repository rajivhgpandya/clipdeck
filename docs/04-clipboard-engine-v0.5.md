# Clipboard Engine v0.5

## Objective

Introduce real operating-system clipboard monitoring.

## Architecture

System Clipboard
-> Rust background watcher
-> Tauri event
-> React history state
-> Local persistent storage

## Monitoring

The Rust backend polls the operating-system clipboard every 500 ms.

Clipboard monitoring runs independently of main-window visibility.

This allows the application to continue recording clipboard changes while operating from the macOS menu bar or Windows system tray.

## Cross-platform library

The clipboard engine uses `arboard`.

Target platforms:

- macOS
- Windows

## History behaviour

Clipboard text entries are:

- recorded automatically
- timestamped
- classified as Text, URL or Code
- deduplicated
- persisted locally
- limited according to the configured History Size

Pinned entries are preserved when normal history entries are trimmed.

## Persistence

History is currently persisted using WebView local storage.

No cloud service or external database is used.

A later persistence layer may migrate history to SQLite without changing the clipboard watcher architecture.

## Keyboard interaction

History supports:

- Arrow Up
- Arrow Down
- Enter

Enter writes the selected historical entry back to the system clipboard.

Automatic paste into the previously active application is intentionally deferred to the Global Shortcut/Paste Engine milestone because it requires foreground-focus handling.

## Current limitations

v0.5 captures text clipboard content.

Images and copied files are not yet stored.

## Next milestone

v0.6:

- real configurable global shortcut recorder
- global shortcut registration
- popup invocation
- foreground application restoration
- automatic paste
