# GitHub Release Preparation v0.8.6

## Distribution channel

Clipdeck is intended for distribution through GitHub Releases.

It is not intended for Mac App Store distribution.

## macOS artifacts

The release pipeline generates:

- Clipdeck.app
- DMG installer
- ZIP archive
- SHA-256 checksums

## Version

All application metadata is aligned to:

0.8.6

This includes:

- npm package
- Tauri application
- Rust package
- macOS bundle

## Signing status

No Apple Developer ID Application certificate is currently installed on the development Mac.

The current artifacts are therefore suitable for local testing but are not yet ready for frictionless public macOS distribution.

Before public GitHub distribution, the recommended pipeline is:

1. Developer ID Application signing
2. Apple notarization
3. DMG signing
4. notarization stapling
5. Gatekeeper verification

This does not require distribution through the Mac App Store.

## GitHub status

Public repository preparation remains pending.

Before the first public push, Git history must be reviewed/cleaned to remove obsolete private branding from historical commits.
