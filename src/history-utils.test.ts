import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyRetention,
  clipboardByteLength,
  isClipboardItemWithinLimit,
  numericJumpIndex,
  orderHistory,
  type HistoryLikeItem,
} from "./history-utils";

function item(
  id: string,
  sequenceNumber: number,
  createdAt: number,
  pinned = false
): HistoryLikeItem {
  return {
    id,
    content: id,
    sequenceNumber,
    createdAt,
    pinned,
  };
}

describe("clipboardByteLength", () => {
  it("counts ASCII bytes", () => {
    expect(
      clipboardByteLength("Clipdeck")
    ).toBe(8);
  });

  it("counts UTF-8 bytes", () => {
    expect(
      clipboardByteLength("€")
    ).toBe(3);
  });
});

describe(
  "isClipboardItemWithinLimit",
  () => {
    it("accepts content at the limit", () => {
      expect(
        isClipboardItemWithinLimit(
          "12345",
          5
        )
      ).toBe(true);
    });

    it("rejects content over the limit", () => {
      expect(
        isClipboardItemWithinLimit(
          "123456",
          5
        )
      ).toBe(false);
    });
  }
);

describe("applyRetention", () => {
  const day =
    24 * 60 * 60 * 1000;

  const now =
    Date.UTC(2026, 7, 27);

  it("keeps everything forever", () => {
    const items = [
      item("old", 1, now - 100 * day),
      item("new", 2, now),
    ];

    expect(
      applyRetention(
        items,
        "forever",
        now
      )
    ).toEqual(items);
  });

  it("removes expired non-pinned items", () => {
    const items = [
      item(
        "expired",
        1,
        now - 8 * day
      ),
      item(
        "current",
        2,
        now - 2 * day
      ),
    ];

    expect(
      applyRetention(
        items,
        "7",
        now
      ).map((entry) => entry.id)
    ).toEqual(["current"]);
  });

  it("preserves expired pinned items", () => {
    const items = [
      item(
        "pinned",
        1,
        now - 100 * day,
        true
      ),
    ];

    expect(
      applyRetention(
        items,
        "1",
        now
      )
    ).toHaveLength(1);
  });
});

describe("orderHistory", () => {
  const items = [
    item("two", 2, 2),
    item("one", 1, 1),
    item("pinned", 3, 3, true),
  ];

  it("keeps pinned first and sorts newest", () => {
    expect(
      orderHistory(
        items,
        "newest"
      ).map((entry) => entry.id)
    ).toEqual([
      "pinned",
      "two",
      "one",
    ]);
  });

  it("keeps pinned first and sorts oldest", () => {
    expect(
      orderHistory(
        items,
        "oldest"
      ).map((entry) => entry.id)
    ).toEqual([
      "pinned",
      "one",
      "two",
    ]);
  });

  it("does not mutate the input", () => {
    const original = [...items];

    orderHistory(items, "newest");

    expect(items).toEqual(original);
  });
});

describe("numericJumpIndex", () => {
  it("maps visible position to zero-based index", () => {
    expect(
      numericJumpIndex("1", 50)
    ).toBe(0);

    expect(
      numericJumpIndex("50", 50)
    ).toBe(49);
  });

  it("rejects positions outside history", () => {
    expect(
      numericJumpIndex("0", 50)
    ).toBeNull();

    expect(
      numericJumpIndex("51", 50)
    ).toBeNull();

    expect(
      numericJumpIndex(
        "48574289564375894326",
        50
      )
    ).toBeNull();
  });

  it("rejects non numeric input", () => {
    expect(
      numericJumpIndex("12x", 50)
    ).toBeNull();
  });
});
