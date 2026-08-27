# Public Repository Preparation v0.8.7

## Scope

This milestone prepares Clipdeck for a clean public GitHub repository.

## Storage migration

The active history key is `clipdeckClipboardHistory`.

Existing local history is migrated automatically from the pre-Clipdeck storage key and the obsolete key is removed after migration.

## Git history

The private development repository retains its historical commits and checkpoints.

A separate public repository is created from the current tracked snapshot with a single initial commit.

This prevents obsolete private branding and historical filenames from becoming part of the public Git history.

## GitHub Actions

CI targets:

- macOS Apple Silicon
- Windows x64

Version tags are prepared to generate draft GitHub Releases.

Developer ID signing and Apple notarization remain required before frictionless public macOS distribution.

## Publishing

No GitHub remote is configured and no push is performed in this milestone.

## Version

Clipdeck v0.8.7
