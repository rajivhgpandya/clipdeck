# macOS Permission Manager v0.8.6

## Purpose

Clipdeck uses macOS Accessibility permission for automatic paste operations.

The application now exposes the current permission status directly in Settings.

## States

The UI can display:

- Checking...
- Granted
- Required

## Grant flow

If permission is not available, the user can select:

`Grant permission`

Clipdeck requests Accessibility permission from macOS.

After returning to the application, the permission state is checked again automatically.

## Scope

The permission is required for:

- restoring automated interaction with the previously active application;
- sending the automatic paste action.

Clipboard monitoring itself does not require Accessibility permission.

## Platform

The Permission Manager is shown only on macOS.

Windows does not display this setting.

## Implementation

Clipdeck uses the Tauri macOS permissions plugin.

Frontend API:

- checkAccessibilityPermission
- requestAccessibilityPermission

Backend plugin:

- tauri-plugin-macos-permissions

## Version

Clipdeck v0.8.6
