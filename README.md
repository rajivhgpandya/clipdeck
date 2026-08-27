# Clipdeck

Local-first clipboard history application for macOS and Windows.

## Stable baseline

Version: v0.7.5

Working features:
- real clipboard monitoring
- persistent local history
- deduplication
- configurable history size
- search
- pin and delete
- configurable global shortcut
- menu bar / system tray architecture
- optional Dock / taskbar presence
- Launch at Login
- keyboard navigation with Arrow Up and Arrow Down
- multi-digit numeric jump
- automatic scrolling
- Enter to paste into the previously active application
- Escape to hide the application
- Clipdeck branding

## Stack

- Tauri 2
- Rust
- React
- TypeScript
- arboard
- Tauri Global Shortcut plugin
- Tauri Autostart plugin
- AppleScript / System Events on macOS
- Enigo for Windows paste automation

## Current limitations

- text clipboard only
- images not yet supported
- copied files not yet supported
- no cloud synchronization
- Windows end-to-end validation pending
- final macOS packaged application pending

## Documentation

Technical milestone documentation is maintained in the docs directory.

## Development

npm run tauri dev

Frontend check: npm run build
Rust check: cargo check --manifest-path src-tauri/Cargo.toml

## Next milestone

v0.8: UX refinement and first real macOS application bundle.


## History ordering

Clipboard entries receive sequential chronological numbers.

Users can display history using:

- Newest first
- Oldest first

Numeric Jump always refers to the visible row position rather than the chronological number.

- Configurable chronological history order

## Build status

The public source tree is continuously validated with GitHub Actions on:

- macOS Apple Silicon
- Windows x64

The first cross-platform CI validation completed successfully for both platforms.

Windows packaging is validated in CI; full Windows runtime testing is still pending.
