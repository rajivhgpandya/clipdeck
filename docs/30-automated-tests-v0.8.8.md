# Automated Tests v0.8.8

## Objective

Clipdeck previously had no automated unit tests.

The v0.8.8 hardening cycle introduces an initial regression suite covering deterministic logic with high regression value.

## Frontend

Test runner:

Vitest

Covered rules:

- UTF-8 clipboard byte-size calculation.
- Maximum clipboard item size.
- History retention.
- Pinned-item retention.
- Newest-first ordering.
- Oldest-first ordering.
- Pinned-first ordering.
- Non-mutating sort behavior.
- Numeric jump bounds.
- Multi-digit numeric jump.
- Invalid numeric jump input.

Commands:

`npm test`

Interactive development:

`npm run test:watch`

## Rust

Initial unit tests cover the bundle-identifier validation rules used to protect the macOS paste path against malformed or injectable application identifiers.

Command:

`cargo test --manifest-path src-tauri/Cargo.toml`

## Continuous Integration

Automated tests are executed by GitHub Actions in addition to compilation and packaging checks.

Windows Smoke also executes the frontend and Rust test suites before producing installer artifacts.

## Scope

These tests intentionally focus on deterministic logic.

They do not replace manual runtime validation for:

- clipboard monitoring;
- system tray/menu bar;
- global shortcuts;
- focus restoration;
- automatic paste;
- Launch at Login;
- operating-system permission flows.

## Future expansion

Additional tests should be added when production logic is extracted into independently testable modules, particularly:

- storage migration;
- shortcut parsing;
- history deduplication;
- sequence-number assignment;
- quota-pruning behavior.

## Version

Target: Clipdeck v0.8.8
