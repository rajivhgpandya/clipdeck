# Privacy and Storage Hardening v0.8.8

## Scope

This phase addresses the privacy and persistence findings from the independent
v0.8.7 technical audit.

## Pause monitoring

Clipboard monitoring can be paused without terminating Clipdeck.

The preference is persistent.

When paused:

- the operating-system clipboard watcher may continue observing clipboard
  changes internally;
- clipboard events are ignored by the history layer;
- no new clipboard entry is persisted.

Monitoring can be resumed from History or Settings.

## Sensitive clipboard disclosure

Clipdeck is local-first, but textual clipboard history is stored locally and
currently unencrypted.

Copied content can include:

- passwords;
- API keys;
- authentication tokens;
- one-time codes;
- other secrets.

The UI and SECURITY.md explicitly disclose this behavior.

Native concealed/transient clipboard markers remain a separate hardening
milestone.

## Maximum clipboard entry size

Text entries larger than 256 KB are not stored.

This prevents a single unusually large clipboard value from exhausting WebView
local storage.

## Storage quota handling

History persistence is protected against localStorage quota failures.

Recovery order:

1. attempt normal persistence;
2. prune oldest non-pinned entries;
3. preserve pinned content whenever possible;
4. if pinned content alone exceeds available quota, prune oldest pinned entries
   as a last resort;
5. if no valid history can be persisted, clear the persisted history.

The UI reports when automatic pruning occurs.

## History retention

Supported retention periods:

- Forever
- 1 day
- 7 days
- 30 days

Retention automatically removes expired non-pinned entries.

Pinned entries are exempt from time-based retention.

Retention is checked:

- when the preference changes;
- once per minute while Clipdeck is running;
- when new history is created.

## Clear history when quitting

Optional privacy preference:

`Clear history when quitting`

Behavior:

### Window close

Closing the Clipdeck window does not terminate the application and does not
clear history.

### Explicit Quit

When the user selects `Quit Clipdeck` from the menu bar/system tray:

1. Rust emits `before-quit`;
2. the frontend synchronously removes persisted history and sequence state when
   the preference is enabled;
3. the frontend invokes `confirm_quit`;
4. Rust terminates the process.

This keeps window hiding separate from explicit application termination.

## Persistence technology

Clipdeck continues to use WebView localStorage.

For the current text-only history size of 25–500 entries this remains
appropriate after quota hardening.

SQLite is not required for this milestone.

## Audit findings addressed

- C1: partially mitigated through pause monitoring and explicit disclosure.
- C2: storage quota and oversized-item handling implemented.
- Privacy controls: expanded.
- Clear-on-quit: implemented.

Native OS sensitive-content markers remain pending.

## Version

Target: Clipdeck v0.8.8
