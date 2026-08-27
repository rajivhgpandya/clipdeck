# Build and Release

## Development

```bash
npm ci
npm run tauri dev
```

## Validation

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

## macOS

```bash
npm run tauri build -- --bundles app,dmg
```

Public macOS GitHub distribution should use Developer ID signing and Apple notarization.

## Windows

```powershell
npm ci
npm run tauri build -- --bundles nsis
```

## GitHub

The repository contains CI and draft-release workflows for macOS and Windows.
