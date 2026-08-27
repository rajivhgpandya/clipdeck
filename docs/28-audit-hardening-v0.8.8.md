# Audit Hardening v0.8.8

## Basis

This hardening cycle follows the independent technical audit performed on
Clipdeck v0.8.7.

## Phase 1 - Repository and code hygiene

Completed items:

- README updated to the current beta state.
- macOS packaging documentation aligned with reality.
- Windows explicitly described as runtime-experimental.
- Sensitive clipboard-content disclosure added to SECURITY.md.
- Tauri/React scaffold metadata corrected.
- Application HTML title and favicon corrected.
- Unused opener plugin and capability removed.
- Dead shortcut-triggered event removed.
- Duplicate Windows cfg attribute removed.
- Cargo package metadata corrected.

## Remaining audit phases

### Phase 2 - Privacy and persistence

- Pause clipboard monitoring.
- Sensitive-content controls.
- Clipboard item size limit.
- localStorage quota handling and pruning.
- Retention controls.

### Phase 3 - Automated tests

- Vitest frontend unit tests.
- Rust unit tests.
- Mandatory test stages in GitHub Actions.
- Pure-function extraction where required for testing.

### Phase 4 - Platform/runtime hardening

- Explicit Windows foreground restoration.
- Async/non-blocking paste command.
- Windows-safe default shortcut.
- Restrictive CSP.
- Hidden startup behavior.
- Target-specific Enigo dependency.
- CSS legacy cleanup.

## Version

Target: Clipdeck v0.8.8

## Phase 2 status

Privacy and persistence hardening completed:

- Pause monitoring.
- Persistent monitoring state.
- History retention controls.
- Clear history on explicit Quit.
- 256 KB per-item storage limit.
- localStorage quota recovery and pruning.
- Sensitive-content disclosure in UI and SECURITY.md.

See:

`docs/29-privacy-storage-hardening-v0.8.8.md`
