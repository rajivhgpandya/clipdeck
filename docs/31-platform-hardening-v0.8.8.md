# Platform Hardening v0.8.8

## Scope

Final phase of the v0.8.8 hardening cycle following the independent v0.8.7 audit.

## CI enforcement

Both macOS and Windows CI now execute:

1. npm ci
2. npm test
3. npm run build
4. cargo check
5. cargo test
6. Tauri packaging

A package build therefore cannot pass CI while either unit-test suite is failing.

## Content Security Policy

The previous null CSP has been replaced with a restrictive application policy.

The policy permits only the resources required by the local Tauri frontend and IPC/assets.

Inline styles remain allowed because the current React UI uses style attributes and runtime appearance values.

Clipboard content continues to be rendered as React text rather than raw HTML.

## Startup behavior

The main window is configured as initially hidden.

This avoids displaying the full history window automatically when Clipdeck starts, particularly when Launch at Login is enabled.

The window remains available through the global shortcut and tray/menu-bar actions.

## Windows-only Enigo dependency

Enigo is used by the Windows paste implementation and is now scoped to the Windows Cargo target.

This reduces unnecessary dependency surface on macOS.

## Sequence-number purity

Clipboard sequence allocation no longer occurs from inside the React state updater.

A sequence number is allocated before setItems and then passed into the state transformation.

This avoids development-only sequence jumps caused by React StrictMode invoking state updater functions more than once.

## Windows paste/focus status

The independent audit identified a plausible Windows focus-restoration risk.

This is NOT marked fixed in v0.8.8.

Reason:

- Windows runtime has not been validated on real Windows hardware.
- The current implementation compiles and packages successfully.
- Adding SetForegroundWindow or other Win32 focus manipulation without runtime validation could introduce a regression rather than remove one.

Windows therefore remains explicitly experimental.

Required validation:

1. Windows 10/11 real machine.
2. Open a target application.
3. Invoke Clipdeck with the global shortcut.
4. Select an item.
5. Confirm Clipdeck hides.
6. Confirm the target application receives focus.
7. Confirm Ctrl+V is delivered to the target application.

If this fails, explicit HWND tracking and foreground restoration becomes a confirmed remediation item.

## Paste async status

The synchronous paste command remains unchanged for v0.8.8.

macOS runtime behavior is already validated and the current delay is short.

Moving native focus/paste behavior to asynchronous execution is deferred until the platform-specific paste paths can be runtime-tested together.

## Native sensitive clipboard markers

Pause monitoring, retention, size limits, quota recovery, clear-on-quit and privacy disclosure were completed earlier in v0.8.8.

Native exclusion markers remain pending:

- macOS concealed/transient pasteboard types.
- Windows ExcludeClipboardContentFromMonitorProcessing.

These require platform-specific runtime validation and are not falsely claimed as implemented.

## Version

Clipdeck v0.8.8 Beta
