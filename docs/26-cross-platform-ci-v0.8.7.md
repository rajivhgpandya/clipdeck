# Cross-Platform CI Validation v0.8.7

## Result

The first public GitHub Actions CI run completed successfully.

GitHub Actions run:

`33063062081`

## macOS

Platform:

- macOS GitHub-hosted runner
- Apple Silicon target
- `aarch64-apple-darwin`

Validated stages:

- npm dependency installation
- TypeScript / Vite frontend build
- Rust compilation check
- Tauri application bundle
- macOS application bundle
- DMG generation

Result:

`SUCCESS`

## Windows

Platform:

- Windows GitHub-hosted runner
- x64
- NSIS packaging

Validated stages:

- npm dependency installation
- TypeScript / Vite frontend build
- Rust compilation check
- Tauri application bundle
- NSIS installer generation

Result:

`SUCCESS`

## Interpretation

This confirms that the same public Clipdeck source tree compiles and packages successfully on both macOS and Windows.

It does not yet constitute full Windows functional validation.

The following still require manual Windows testing:

- global shortcut behavior
- system tray lifecycle
- clipboard monitoring
- automatic paste
- Launch at Login
- taskbar visibility
- application settings persistence

## Release

v0.8.7 is the first version prepared for a GitHub Draft Release containing artifacts for both platforms.

macOS Developer ID signing and notarization are still pending.

## Version

Clipdeck v0.8.7
