# History Visible Position v0.8.5

## Objective

Separate the user-facing list position from the internal chronological event ID.

## Visible numbering

The primary number displayed beside each history row now represents its current visible position.

Example:

1
2
3
4

This numbering is recalculated according to the current sorting and filtering.

It is the same numbering used by Numeric Jump.

## Chronological event ID

Each clipboard event still retains its persistent chronological sequence number.

The event ID is shown only as secondary metadata.

Example:

`Text · Just now · ID 30`

This allows Clipdeck to preserve historical identity without confusing it with keyboard navigation.

## History order control

History order can now be changed directly from the History page.

Available values:

- Newest first
- Oldest first

The control uses the same persistent `historyOrder` preference available in Settings.

Changing it in either location updates the same state.

## Numeric Jump

Numeric Jump continues to target the visible position.

Example:

If the list shows:

1 -> event ID 30
2 -> event ID 28
3 -> event ID 26

pressing `2` selects the second visible row, regardless of its internal event ID.

## Version

Clipdeck v0.8.5
