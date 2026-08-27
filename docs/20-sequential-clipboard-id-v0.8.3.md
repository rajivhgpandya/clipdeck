# Sequential Clipboard ID v0.8.3

## Objective

Separate the persistent identity of a clipboard entry from its current position in the history list.

## Previous behaviour

The number displayed beside each clipboard entry represented its current list position.

The newest item was always displayed as `1`.

When a new clipboard entry was added, all previous numbers changed.

## New behaviour

Each new clipboard entry receives a permanent sequential identifier.

Examples:

`#101`

`#102`

`#103`

The identifier never changes during the lifetime of that entry.

## Recopied content

If an existing clipboard value is copied again:

- no duplicate entry is created;
- the existing entry keeps its original sequential ID;
- its timestamp is refreshed;
- it returns to the appropriate recent position.

## Numeric Jump

Numeric Jump continues to use the current visual position, not the permanent ID.

Example:

The first visible item may be `#1482`.

Pressing:

`1`

still selects the first visible item.

This keeps keyboard navigation fast while preserving stable item identity.

## Persistence

The next sequence value is stored locally using:

`clipboardSequence`

Existing history entries created before v0.8.3 are migrated automatically and assigned permanent sequence numbers.

## Version

Clipdeck v0.8.3
