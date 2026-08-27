# Clipdeck

Local-first clipboard history for macOS and Windows.

**Current release: v0.8.7 Beta**

- macOS Apple Silicon runtime: manually validated
- Windows x64: build/package/smoke validated in CI; runtime remains experimental
- Distribution: GitHub Releases
- macOS builds are currently unsigned and not notarized
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
- macOS GitHub DMG packaging validated

## Documentation

Technical milestone documentation is maintained in the docs directory.

## Development

npm run tauri dev

Frontend check: npm run build
Rust check: cargo check --manifest-path src-tauri/Cargo.toml


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


## Installation status

### macOS

macOS runtime has been manually validated on Apple Silicon.

The GitHub build is currently unsigned and not notarized. macOS may therefore block the first launch with a Gatekeeper warning.

To open Clipdeck:

1. Install Clipdeck from the DMG.
2. Try to open Clipdeck normally.
3. If macOS blocks it, open **System Settings → Privacy & Security**.
4. Find the Clipdeck security message.
5. Select **Open Anyway**.
6. Confirm the launch.

This warning is expected for the current unsigned GitHub build.

Validation status:

- Application runtime: PASS
- Clipboard monitoring: PASS
- Global shortcut: PASS
- History navigation: PASS
- Automatic paste: PASS
- Menu bar mode: PASS
- Settings persistence: PASS
- GitHub DMG installation: PASS
- Apple notarization: NOT IMPLEMENTED

### Windows

Windows builds are produced successfully by GitHub Actions.

Current status:

- Rust compilation: PASS
- Frontend build: PASS
- NSIS installer generation: PASS
- MSI installer generation: PASS
- Automated package smoke checks: enabled
- Manual Windows runtime validation: NOT YET PERFORMED

The Windows release should therefore be considered beta software until runtime testing is completed on a real Windows 10/11 machine.

