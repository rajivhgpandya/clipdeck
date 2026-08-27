# History Order v0.8.4

## Objective

Separate chronological numbering from the visual direction of clipboard history.

## Chronological sequence

Each clipboard event receives a monotonically increasing sequence number.

Example:

1
2
3
4
5

A newly copied item always receives a number greater than every previous clipboard event.

## Recopied content

When existing content is copied again:

- no duplicate clipboard record is created;
- the existing record receives a new chronological sequence number;
- its timestamp is refreshed;
- it becomes the newest clipboard event.

The internal technical ID remains unchanged.

## History order

Users can choose:

### Newest first

Example:

12
11
10
9
8

### Oldest first

Example:

8
9
10
11
12

The preference is stored locally.

## Numeric Jump

Numeric Jump remains based on the visible row position.

It does not use the chronological sequence number.

Example:

If the visible list is:

12
11
10

pressing `1` selects the row containing 12.

Pressing `3` selects the row containing 10.

## Pinned items

Pinned items remain grouped before normal history items.

Within each group, the selected chronological order is respected.

## Version

Clipdeck v0.8.4
