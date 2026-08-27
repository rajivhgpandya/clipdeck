export type RetentionPeriod =
  | "forever"
  | "1"
  | "7"
  | "30";

export interface HistoryLikeItem {
  id: string;
  content: string;
  createdAt: number;
  pinned: boolean;
  sequenceNumber: number;
}

export function clipboardByteLength(
  content: string
): number {
  return new TextEncoder()
    .encode(content)
    .byteLength;
}

export function isClipboardItemWithinLimit(
  content: string,
  maxBytes = 256 * 1024
): boolean {
  return (
    clipboardByteLength(content) <=
    maxBytes
  );
}

export function applyRetention<
  T extends HistoryLikeItem
>(
  items: T[],
  retention: RetentionPeriod,
  now = Date.now()
): T[] {
  if (retention === "forever") {
    return items;
  }

  const days = Number(retention);

  if (!Number.isFinite(days)) {
    return items;
  }

  const threshold =
    now -
    days * 24 * 60 * 60 * 1000;

  return items.filter(
    (item) =>
      item.pinned ||
      item.createdAt >= threshold
  );
}

export function orderHistory<
  T extends HistoryLikeItem
>(
  items: T[],
  order: "newest" | "oldest"
): T[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return (
        Number(b.pinned) -
        Number(a.pinned)
      );
    }

    return order === "oldest"
      ? a.sequenceNumber -
          b.sequenceNumber
      : b.sequenceNumber -
          a.sequenceNumber;
  });
}

export function numericJumpIndex(
  digits: string,
  itemCount: number
): number | null {
  if (!/^\d+$/.test(digits)) {
    return null;
  }

  const position = Number(digits);

  if (
    !Number.isSafeInteger(position) ||
    position < 1 ||
    position > itemCount
  ) {
    return null;
  }

  return position - 1;
}
