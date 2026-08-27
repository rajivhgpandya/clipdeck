# Runtime Validation v0.8.7

## Release status

Clipdeck v0.8.7 is the first public beta candidate distributed through GitHub Releases.

## macOS

Platform tested:

- macOS
- Apple Silicon
- GitHub-generated ARM64 DMG

### Manual validation

| Component | Result |
|---|---|
| Application launch | PASS |
| Clipboard monitoring | PASS |
| Clipboard history | PASS |
| Search | PASS |
| Numeric Jump | PASS |
| Arrow navigation | PASS |
| Configurable global shortcut | PASS |
| Automatic paste | PASS |
| Menu bar lifecycle | PASS |
| Optional Dock visibility | PASS |
| Launch at Login | PASS |
| Appearance preferences | PASS |
| Settings persistence | PASS |
| GitHub DMG installation | PASS |

### Gatekeeper

Result:

`EXPECTED WARNING`

Reason:

The GitHub-generated macOS artifact is not signed with an Apple Developer ID and is not notarized.

Current installation procedure:

`System Settings → Privacy & Security → Open Anyway`

This is an intentional distribution decision for the current beta.

## Windows

GitHub Actions successfully compile and package Clipdeck on Windows x64.

### CI validation

| Component | Result |
|---|---|
| Frontend build | PASS |
| Rust compile/check | PASS |
| Tauri Windows build | PASS |
| NSIS generation | PASS |
| MSI generation | PASS |
| Package smoke validation | PASS / CI |
| Manual application runtime | NOT TESTED |
| System tray behavior | NOT TESTED |
| Global shortcut runtime | NOT TESTED |
| Automatic paste runtime | NOT TESTED |
| Launch at Login runtime | NOT TESTED |

Windows should therefore be considered supported at build/package level but runtime-beta until manual validation is available.

## Distribution

Channel:

GitHub Releases

Release classification:

Beta / prerelease

## Version

Clipdeck v0.8.7
