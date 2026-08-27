import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";

import {
  checkAccessibilityPermission,
  requestAccessibilityPermission,
} from "tauri-plugin-macos-permissions-api";
import "./App.css";

type Page = "history" | "settings";
type HistoryOrder = "newest" | "oldest";
type RetentionPeriod = "forever" | "1" | "7" | "30";
type AppearanceMode = "system" | "light" | "dark";
type AccentMode =
  | "system"
  | "cyan"
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "pink";
type ClipboardType = "Text" | "URL" | "Code";

type ClipboardItem = {
  id: string;
  sequenceNumber: number;
  content: string;
  type: ClipboardType;
  createdAt: number;
  pinned: boolean;
};

const STORAGE_HISTORY = "clipdeckClipboardHistory";
const LEGACY_STORAGE_HISTORY_B64 = "dG5uQ2xpcGJvYXJkSGlzdG9yeQ==";
const STORAGE_LIMIT = "historyLimit";
const STORAGE_BINDING = "shortcutBinding";
const STORAGE_DOCK = "showInDock";
const STORAGE_APPEARANCE = "appearance";
const STORAGE_ACCENT = "accent";
const STORAGE_WINDOW_HEIGHT = "windowHeight";
const STORAGE_SEQUENCE = "clipboardSequence";
const STORAGE_HISTORY_ORDER = "historyOrder";
const STORAGE_MONITORING_PAUSED = "monitoringPaused";
const STORAGE_RETENTION = "historyRetention";
const STORAGE_CLEAR_ON_QUIT = "clearHistoryOnQuit";

const MAX_CLIPBOARD_ITEM_BYTES =
  256 * 1024;


const isMac =
  navigator.userAgent.toLowerCase().includes("mac");

const DEFAULT_SHORTCUT =
  "CommandOrControl+Shift+V";

function classifyContent(
  content: string
): ClipboardType {
  const value = content.trim();

  if (/^https?:\/\/\S+$/i.test(value)) {
    return "URL";
  }

  if (
    /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|ALTER|DROP)\b/i.test(
      value
    ) ||
    /[{}();][\s\S]*[{}();]/.test(value)
  ) {
    return "Code";
  }

  return "Text";
}


function clipboardByteLength(
  content: string
): number {
  return new TextEncoder()
    .encode(content)
    .byteLength;
}

function applyRetention(
  items: ClipboardItem[],
  retention: RetentionPeriod
): ClipboardItem[] {
  if (retention === "forever") {
    return items;
  }

  const days = Number(retention);

  if (!Number.isFinite(days)) {
    return items;
  }

  const threshold =
    Date.now() -
    days * 24 * 60 * 60 * 1000;

  return items.filter(
    (item) =>
      item.pinned ||
      item.createdAt >= threshold
  );
}

function persistHistoryWithPruning(
  items: ClipboardItem[]
): ClipboardItem[] {
  const tryWrite = (
    candidate: ClipboardItem[]
  ): boolean => {
    try {
      localStorage.setItem(
        STORAGE_HISTORY,
        JSON.stringify(candidate)
      );

      return true;
    } catch {
      return false;
    }
  };

  if (tryWrite(items)) {
    return items;
  }

  let candidate = [...items];

  // Remove oldest non-pinned entries first.
  const nonPinned =
    candidate
      .filter((item) => !item.pinned)
      .sort(
        (a, b) =>
          a.createdAt - b.createdAt
      );

  for (const removable of nonPinned) {
    candidate =
      candidate.filter(
        (item) =>
          item.id !== removable.id
      );

    if (tryWrite(candidate)) {
      return candidate;
    }
  }

  // Preserve pinned entries whenever possible.
  // If pinned content alone exceeds quota,
  // remove the oldest pinned entries as a
  // last-resort recovery mechanism.
  const pinned =
    candidate
      .filter((item) => item.pinned)
      .sort(
        (a, b) =>
          a.createdAt - b.createdAt
      );

  for (const removable of pinned) {
    candidate =
      candidate.filter(
        (item) =>
          item.id !== removable.id
      );

    if (tryWrite(candidate)) {
      return candidate;
    }
  }

  try {
    localStorage.removeItem(
      STORAGE_HISTORY
    );
  } catch {
    // Nothing else can be recovered here.
  }

  return [];
}

function loadHistory(): ClipboardItem[] {
  try {
    let raw =
      localStorage.getItem(STORAGE_HISTORY);

    if (!raw) {
      const legacyKey =
        atob(LEGACY_STORAGE_HISTORY_B64);

      const legacyRaw =
        localStorage.getItem(legacyKey);

      if (legacyRaw) {
        localStorage.setItem(
          STORAGE_HISTORY,
          legacyRaw
        );

        localStorage.removeItem(
          legacyKey
        );

        raw = legacyRaw;
      }
    }

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    let maxSequence = Number(
      localStorage.getItem(
        STORAGE_SEQUENCE
      ) || "0"
    );

    const migrated = parsed.map(
      (item: ClipboardItem) => {
        if (
          Number.isInteger(item.sequenceNumber) &&
          item.sequenceNumber > 0
        ) {
          maxSequence = Math.max(
            maxSequence,
            item.sequenceNumber
          );

          return item;
        }

        maxSequence += 1;

        return {
          ...item,
          sequenceNumber: maxSequence,
        };
      }
    );

    localStorage.setItem(
      STORAGE_SEQUENCE,
      String(maxSequence)
    );

    return migrated;
  } catch {
    return [];
  }
}

function relativeTime(
  timestamp: number
): string {
  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) / 1000
    )
  );

  if (seconds < 10) return "Just now";
  if (seconds < 60)
    return `${seconds} sec ago`;

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60)
    return `${minutes} min ago`;

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24)
    return `${hours} h ago`;

  return `${Math.floor(hours / 24)} d ago`;
}

function nextSequenceNumber(): number {
  const current = Number(
    localStorage.getItem(
      STORAGE_SEQUENCE
    ) || "0"
  );

  const next = current + 1;

  localStorage.setItem(
    STORAGE_SEQUENCE,
    String(next)
  );

  return next;
}

function createItem(
  content: string,
  sequenceNumber = nextSequenceNumber()
): ClipboardItem {
  return {
    id:
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .slice(2),

    sequenceNumber,

    content,
    type: classifyContent(content),
    createdAt: Date.now(),
    pinned: false,
  };
}

function displayShortcut(
  shortcut: string
): string {
  return shortcut
    .replace(
      "CommandOrControl",
      isMac ? "⌘" : "Ctrl"
    )
    .replace(/Command/g, "⌘")
    .replace(/Control/g, "Ctrl")
    .replace(/Shift/g, "⇧")
    .replace(/Alt/g, isMac ? "⌥" : "Alt")
    .replace(/\+/g, " ");
}

function liveShortcutPreview(
  event: {
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    key: string;
    code?: string;
  }
): string {
  const parts: string[] = [];

  if (isMac) {
    if (event.metaKey) parts.push("⌘");
    if (event.ctrlKey) parts.push("Ctrl");
  } else {
    if (event.ctrlKey) parts.push("Ctrl");
    if (event.metaKey) parts.push("Win");
  }

  if (event.altKey) {
    parts.push(isMac ? "⌥" : "Alt");
  }

  if (event.shiftKey) {
    parts.push("⇧");
  }

  const modifierKeys = [
    "Meta",
    "Control",
    "Alt",
    "Shift",
  ];

  if (!modifierKeys.includes(event.key)) {
    let key = event.key;

    if (event.code?.startsWith("Key")) {
      key = event.code.slice(3);
    } else if (event.code?.startsWith("Digit")) {
      key = event.code.slice(5);
    } else if (event.code?.startsWith("F")) {
      key = event.code;
    } else if (event.code === "Space") {
      key = "Space";
    } else if (key === " ") {
      key = "Space";
    } else if (key.length === 1) {
      key = key.toUpperCase();
    }

    parts.push(key);
  }

  return parts.join(" ");
}

function keyboardEventToShortcut(
  event: {
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    key: string;
    code?: string;
  }
): string | null {
  const modifiers: string[] = [];

  if (isMac) {
    if (event.metaKey) {
      modifiers.push(
        "CommandOrControl"
      );
    }

    if (event.ctrlKey) {
      modifiers.push("Control");
    }
  } else {
    if (event.ctrlKey) {
      modifiers.push(
        "CommandOrControl"
      );
    }

    if (event.metaKey) {
      modifiers.push("Meta");
    }
  }

  if (event.altKey) {
    modifiers.push("Alt");
  }

  if (event.shiftKey) {
    modifiers.push("Shift");
  }

  const modifierKeys = [
    "Meta",
    "Control",
    "Alt",
    "Shift",
  ];

  if (
    modifierKeys.includes(event.key)
  ) {
    return null;
  }

  if (modifiers.length === 0) {
    return null;
  }

  let key = event.key;

  // Su macOS event.key può contenere il carattere risultante
  // dalla combinazione, es. Option+V => √.
  // event.code identifica invece il tasto fisico premuto.
  if (event.code?.startsWith("Key")) {
    key = event.code.slice(3);
  } else if (event.code?.startsWith("Digit")) {
    key = event.code.slice(5);
  } else if (event.code?.startsWith("F")) {
    key = event.code;
  } else if (event.code === "Space") {
    key = "Space";
  } else if (key === " ") {
    key = "Space";
  } else if (key.length === 1) {
    key = key.toUpperCase();
  }

  const allowed =
    /^[A-Z0-9]$/.test(key) ||
    /^F([1-9]|1[0-2])$/.test(key) ||
    [
      "Space",
      "Enter",
      "Home",
      "End",
      "PageUp",
      "PageDown",
    ].includes(key);

  if (!allowed) {
    return null;
  }

  return [...modifiers, key].join("+");
}

export default function App() {
  const appWindow =
    getCurrentWindow();

  const appRootRef =
    useRef<HTMLDivElement>(null);

  const searchRef =
    useRef<HTMLInputElement>(null);

  const itemRefs =
    useRef<Array<HTMLDivElement | null>>([]);

  const lastClipboardRef =
    useRef("");

  const pendingShortcutRef =
    useRef<string | null>(null);

  const [page, setPage] =
    useState<Page>("history");

  const [items, setItems] =
    useState<ClipboardItem[]>(
      loadHistory
    );

  const [query, setQuery] =
    useState("");

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(0);

  const [
    numericJump,
    setNumericJump,
  ] = useState("");

  const numericJumpRef =
    useRef("");

  const numericJumpTimerRef =
    useRef<number | null>(null);

  const [
    shortcutBinding,
    setShortcutBinding,
  ] = useState(
    localStorage.getItem(
      STORAGE_BINDING
    ) || DEFAULT_SHORTCUT
  );

  const [
    recordingShortcut,
    setRecordingShortcut,
  ] = useState(false);

  const [
    shortcutPreview,
    setShortcutPreview,
  ] = useState("");

  const [
    shortcutError,
    setShortcutError,
  ] = useState("");

  const [
    historyLimit,
    setHistoryLimit,
  ] = useState(
    localStorage.getItem(
      STORAGE_LIMIT
    ) || "50"
  );

  const [
    historyOrder,
    setHistoryOrder,
  ] = useState<HistoryOrder>(
    (localStorage.getItem(
      STORAGE_HISTORY_ORDER
    ) as HistoryOrder) || "newest"
  );

  const [
    showInDock,
    setShowInDock,
  ] = useState(
    localStorage.getItem(
      STORAGE_DOCK
    ) !== "false"
  );

  const [
    appearance,
    setAppearance,
  ] = useState<AppearanceMode>(
    (localStorage.getItem(STORAGE_APPEARANCE) as AppearanceMode) || "system"
  );

  const [
    accent,
    setAccent,
  ] = useState<AccentMode>(
    (localStorage.getItem(STORAGE_ACCENT) as AccentMode) || "system"
  );

  const [
    windowHeight,
    setWindowHeight,
  ] = useState(
    Number(localStorage.getItem(STORAGE_WINDOW_HEIGHT) || "700")
  );

  const [
    launchAtLogin,
    setLaunchAtLogin,
  ] = useState(false);

  const [
    autostartReady,
    setAutostartReady,
  ] = useState(false);

  const [
    monitoring,
    setMonitoring,
  ] = useState(false);

  const [
    monitoringPaused,
    setMonitoringPaused,
  ] = useState(
    localStorage.getItem(
      STORAGE_MONITORING_PAUSED
    ) === "true"
  );

  const monitoringPausedRef =
    useRef(
      localStorage.getItem(
        STORAGE_MONITORING_PAUSED
      ) === "true"
    );

  const [
    retentionPeriod,
    setRetentionPeriod,
  ] = useState<RetentionPeriod>(
    (localStorage.getItem(
      STORAGE_RETENTION
    ) as RetentionPeriod) ||
      "forever"
  );

  const retentionPeriodRef =
    useRef<RetentionPeriod>(
      (localStorage.getItem(
        STORAGE_RETENTION
      ) as RetentionPeriod) ||
        "forever"
    );

  const [
    clearHistoryOnQuit,
    setClearHistoryOnQuit,
  ] = useState(
    localStorage.getItem(
      STORAGE_CLEAR_ON_QUIT
    ) === "true"
  );

  const clearHistoryOnQuitRef =
    useRef(
      localStorage.getItem(
        STORAGE_CLEAR_ON_QUIT
      ) === "true"
    );

  const [
    storageNotice,
    setStorageNotice,
  ] = useState("");

  const [
    accessibilityGranted,
    setAccessibilityGranted,
  ] = useState<boolean | null>(null);

  const filtered = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    return [...items]
      .filter((item) =>
        item.content
          .toLowerCase()
          .includes(normalized)
      )
      .sort((a, b) => {
        if (
          a.pinned !== b.pinned
        ) {
          return (
            Number(b.pinned) -
            Number(a.pinned)
          );
        }

        if (historyOrder === "oldest") {
          return (
            a.sequenceNumber -
            b.sequenceNumber
          );
        }

        return (
          b.sequenceNumber -
          a.sequenceNumber
        );
      });
  }, [items, query, historyOrder]);

  async function showHistory() {
    setPage("history");
    setQuery("");
    setSelectedIndex(0);

    await appWindow.show();
    await appWindow.unminimize();
    await appWindow.setFocus();

    window.setTimeout(() => {
      searchRef.current?.blur();
      appRootRef.current?.focus();
    }, 60);
  }

  async function installShortcut(
    shortcut: string
  ) {
    try {
      await invoke(
        "register_global_shortcut",
        {
          shortcut,
        }
      );

      setShortcutBinding(shortcut);

      localStorage.setItem(
        STORAGE_BINDING,
        shortcut
      );

      setShortcutError("");

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "Shortcut registration error:",
        error
      );

      setShortcutError(
        `Registration failed: ${message}`
      );

      return false;
    }
  }

  useEffect(() => {
    const persisted =
      persistHistoryWithPruning(items);

    if (
      persisted.length !==
      items.length
    ) {
      setStorageNotice(
        "History was automatically pruned because local storage was full."
      );

      setItems(persisted);
    }
  }, [items]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_HISTORY_ORDER,
      historyOrder
    );
  }, [historyOrder]);

  useEffect(() => {
    monitoringPausedRef.current =
      monitoringPaused;

    localStorage.setItem(
      STORAGE_MONITORING_PAUSED,
      String(monitoringPaused)
    );
  }, [monitoringPaused]);

  useEffect(() => {
    retentionPeriodRef.current =
      retentionPeriod;

    localStorage.setItem(
      STORAGE_RETENTION,
      retentionPeriod
    );

    const applyNow = () => {
      setItems(
        (current) =>
          applyRetention(
            current,
            retentionPeriod
          )
      );
    };

    applyNow();

    const timer =
      window.setInterval(
        applyNow,
        60 * 1000
      );

    return () => {
      window.clearInterval(timer);
    };
  }, [retentionPeriod]);

  useEffect(() => {
    clearHistoryOnQuitRef.current =
      clearHistoryOnQuit;

    localStorage.setItem(
      STORAGE_CLEAR_ON_QUIT,
      String(clearHistoryOnQuit)
    );
  }, [clearHistoryOnQuit]);

  useEffect(() => {
    const limit =
      Number(historyLimit);

    setItems((current) => {
      const pinned =
        current.filter(
          (item) => item.pinned
        );

      const normal =
        current
          .filter(
            (item) =>
              !item.pinned
          )
          .sort(
            (a, b) =>
              b.createdAt -
              a.createdAt
          );

      return [
        ...pinned,
        ...normal.slice(
          0,
          Math.max(
            0,
            limit -
              pinned.length
          )
        ),
      ];
    });

    localStorage.setItem(
      STORAGE_LIMIT,
      historyLimit
    );
  }, [historyLimit]);

  useEffect(() => {
    const setup = async () => {
      try {
        setLaunchAtLogin(
          await isAutostartEnabled()
        );
      } catch (error) {
        console.error(error);
      } finally {
        setAutostartReady(true);
      }

      try {
        await invoke(
          "set_app_visibility_mode",
          {
            showInDockOrTaskbar:
              showInDock,
          }
        );
      } catch (error) {
        console.error(error);
      }

      await installShortcut(
        shortcutBinding
      );
    };

    setup();

    const navigationListener =
      listen<string>(
        "navigate",
        async (event) => {
          if (
            event.payload ===
            "settings"
          ) {
            setPage("settings");
          } else {
            await showHistory();
          }
        }
      );

    const quitListener =
      listen(
        "before-quit",
        async () => {
          if (
            clearHistoryOnQuitRef.current
          ) {
            try {
              localStorage.removeItem(
                STORAGE_HISTORY
              );

              localStorage.removeItem(
                STORAGE_SEQUENCE
              );
            } catch (error) {
              console.error(
                "Unable to clear history before quit:",
                error
              );
            }

            setItems([]);
          }

          await invoke(
            "confirm_quit"
          );
        }
      );

    const clipboardListener =
      listen<string>(
        "clipboard-changed",
        (event) => {
          const content =
            event.payload;

          if (
            monitoringPausedRef.current
          ) {
            return;
          }

          if (
            !content ||
            content ===
              lastClipboardRef.current
          ) {
            return;
          }

          if (
            clipboardByteLength(content) >
            MAX_CLIPBOARD_ITEM_BYTES
          ) {
            lastClipboardRef.current =
              content;

            setStorageNotice(
              "Skipped a clipboard item larger than 256 KB."
            );

            return;
          }

          lastClipboardRef.current =
            content;

          setMonitoring(true);

          const eventSequenceNumber =
            nextSequenceNumber();

          setItems(
            (current) => {
              const existing =
                current.find(
                  (item) =>
                    item.content ===
                    content
                );

              if (existing) {
                return current.map(
                  (item) =>
                    item.id ===
                    existing.id
                      ? {
                          ...item,
                          sequenceNumber:
                            eventSequenceNumber,
                          createdAt:
                            Date.now(),
                        }
                      : item
                );
              }

              const limit =
                Number(
                  localStorage.getItem(
                    STORAGE_LIMIT
                  ) || "50"
                );

              const next = [
                createItem(
                  content,
                  eventSequenceNumber
                ),
                ...current,
              ];

              const pinned =
                next.filter(
                  (item) =>
                    item.pinned
                );

              const normal =
                next
                  .filter(
                    (item) =>
                      !item.pinned
                  )
                  .sort(
                    (a, b) =>
                      b.createdAt -
                      a.createdAt
                  );

              return applyRetention(
                [
                  ...pinned,
                  ...normal.slice(
                    0,
                    Math.max(
                      0,
                      limit -
                        pinned.length
                    )
                  ),
                ],
                retentionPeriodRef.current
              );
            }
          );
        }
      );

    return () => {
      navigationListener.then(
        (fn) => fn()
      );

      clipboardListener.then(
        (fn) => fn()
      );

      quitListener.then(
        (fn) => fn()
      );
    };
  }, []);

  useEffect(() => {
    if (!recordingShortcut) {
      return;
    }

    const keyDownHandler =
      (event: KeyboardEvent) => {
        captureShortcut(event);
      };

    const keyUpHandler =
      (event: KeyboardEvent) => {
        void commitShortcut(event);
      };

    window.addEventListener(
      "keydown",
      keyDownHandler,
      true
    );

    window.addEventListener(
      "keyup",
      keyUpHandler,
      true
    );

    return () => {
      window.removeEventListener(
        "keydown",
        keyDownHandler,
        true
      );

      window.removeEventListener(
        "keyup",
        keyUpHandler,
        true
      );
    };
  }, [recordingShortcut]);

  useEffect(() => {
    if (
      selectedIndex >=
      filtered.length
    ) {
      setSelectedIndex(
        Math.max(
          0,
          filtered.length - 1
        )
      );
    }
  }, [
    filtered.length,
    selectedIndex,
  ]);

  useEffect(() => {
    const globalKeyHandler =
      (event: KeyboardEvent) => {
        if (
          page !== "history" ||
          recordingShortcut
        ) {
          return;
        }

        const target =
          event.target as HTMLElement | null;

        const typing =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target?.isContentEditable;

        // Se l'utente sta scrivendo nella search,
        // lasciamo i numeri al campo di testo.
        if (typing) {
          return;
        }

        if (
          /^[0-9]$/.test(event.key) &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey
        ) {
          event.preventDefault();
          event.stopPropagation();

          handleNumericJump(
            event.key
          );

          return;
        }

        if (
          event.key === "ArrowDown"
        ) {
          event.preventDefault();

          setSelectedIndex(
            (current) =>
              Math.min(
                filtered.length - 1,
                current + 1
              )
          );

          return;
        }

        if (
          event.key === "ArrowUp"
        ) {
          event.preventDefault();

          setSelectedIndex(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );

          return;
        }

        if (
          event.key === "Enter"
        ) {
          const item =
            filtered[selectedIndex];

          if (item) {
            event.preventDefault();
            void pasteItem(item);
          }

          return;
        }

        if (
          event.key === "Escape"
        ) {
          event.preventDefault();
          void appWindow.hide();
        }
      };

    window.addEventListener(
      "keydown",
      globalKeyHandler,
      true
    );

    return () => {
      window.removeEventListener(
        "keydown",
        globalKeyHandler,
        true
      );
    };
  }, [
    page,
    recordingShortcut,
    filtered,
    selectedIndex,
  ]);

  useEffect(() => {
    if (page !== "history") {
      return;
    }

    const selected =
      itemRefs.current[selectedIndex];

    if (selected) {
      selected.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex, page]);

  async function copyItem(
    item: ClipboardItem
  ) {
    lastClipboardRef.current =
      item.content;

    await invoke(
      "write_clipboard_text",
      {
        text: item.content,
      }
    );

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              createdAt:
                Date.now(),
            }
          : entry
      )
    );
  }

  async function pasteItem(
    item: ClipboardItem
  ) {
    lastClipboardRef.current =
      item.content;

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              createdAt:
                Date.now(),
            }
          : entry
      )
    );

    try {
      await invoke(
        "paste_clipboard_text",
        {
          text: item.content,
        }
      );
    } catch (error) {
      console.error(
        "Paste error:",
        error
      );

      // Fallback:
      // almeno il contenuto rimane
      // correttamente nella clipboard.
      await copyItem(item);
    }
  }

  function togglePin(
    id: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              pinned:
                !item.pinned,
            }
          : item
      )
    );
  }

  function deleteItem(
    id: string
  ) {
    setItems((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    );
  }

  function clearHistory() {
    setItems((current) =>
      current.filter(
        (item) => item.pinned
      )
    );
  }

  function applyAppearancePreferences(
    nextAppearance: AppearanceMode,
    nextAccent: AccentMode
  ) {
    const root = document.documentElement;

    root.dataset.theme = nextAppearance;
    root.dataset.accent = nextAccent;

    const accents: Record<AccentMode, string> = {
      system: "AccentColor",
      cyan: "#27c7df",
      blue: "#0a84ff",
      purple: "#bf5af2",
      green: "#30d158",
      orange: "#ff9f0a",
      pink: "#ff375f",
    };

    root.style.setProperty("--accent", accents[nextAccent]);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_APPEARANCE, appearance);
    localStorage.setItem(STORAGE_ACCENT, accent);

    applyAppearancePreferences(
      appearance,
      accent
    );
  }, [appearance, accent]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_WINDOW_HEIGHT,
      String(windowHeight)
    );

    void appWindow.setSize(
      new LogicalSize(
        1100,
        windowHeight
      )
    );
  }, [windowHeight]);

  async function refreshAccessibilityPermission() {
    if (!isMac) {
      return;
    }

    try {
      const granted =
        await checkAccessibilityPermission();

      setAccessibilityGranted(
        granted
      );
    } catch (error) {
      console.error(
        "Accessibility permission check failed:",
        error
      );

      setAccessibilityGranted(
        false
      );
    }
  }

  async function grantAccessibilityPermission() {
    if (!isMac) {
      return;
    }

    try {
      await requestAccessibilityPermission();

      window.setTimeout(() => {
        void refreshAccessibilityPermission();
      }, 700);
    } catch (error) {
      console.error(
        "Accessibility permission request failed:",
        error
      );
    }
  }

  useEffect(() => {
    void refreshAccessibilityPermission();

    if (!isMac) {
      return;
    }

    const refreshOnFocus = () => {
      void refreshAccessibilityPermission();
    };

    window.addEventListener(
      "focus",
      refreshOnFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
    };
  }, []);

  async function changeLaunchAtLogin(
    value: boolean
  ) {
    setLaunchAtLogin(value);

    try {
      if (value) {
        await enableAutostart();
      } else {
        await disableAutostart();
      }

      setLaunchAtLogin(
        await isAutostartEnabled()
      );
    } catch (error) {
      console.error(error);
      setLaunchAtLogin(
        !value
      );
    }
  }

  async function changeDockVisibility(
    value: boolean
  ) {
    setShowInDock(value);

    localStorage.setItem(
      STORAGE_DOCK,
      String(value)
    );

    try {
      await invoke(
        "set_app_visibility_mode",
        {
          showInDockOrTaskbar:
            value,
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  function captureShortcut(
    event: KeyboardEvent
  ) {
    event.preventDefault();
    event.stopPropagation();

    const preview =
      liveShortcutPreview(event);

    setShortcutPreview(preview);

    if (event.key === "Escape") {
      pendingShortcutRef.current = null;
      setRecordingShortcut(false);
      setShortcutPreview("");
      setShortcutError("");
      return;
    }

    const binding =
      keyboardEventToShortcut(event);

    if (!binding) {
      return;
    }

    // Memorizziamo la combinazione ma NON la
    // registriamo mentre i tasti sono ancora premuti.
    pendingShortcutRef.current =
      binding;
  }

  async function commitShortcut(
    event: KeyboardEvent
  ) {
    if (!recordingShortcut) {
      return;
    }

    const modifierKeys = [
      "Meta",
      "Control",
      "Alt",
      "Shift",
    ];

    // Aspettiamo il rilascio del tasto finale,
    // non quello di un semplice modificatore.
    if (
      modifierKeys.includes(event.key)
    ) {
      return;
    }

    const binding =
      pendingShortcutRef.current;

    if (!binding) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    pendingShortcutRef.current = null;

    // Lasciamo a macOS il tempo di completare
    // realmente il rilascio della combinazione.
    await new Promise(
      (resolve) =>
        window.setTimeout(resolve, 120)
    );

    const success =
      await installShortcut(binding);

    if (success) {
      setRecordingShortcut(false);
      setShortcutPreview("");
      setShortcutError("");
    } else {
      setRecordingShortcut(true);
      setShortcutPreview("");
    }
  }

  function handleNumericJump(
    digit: string
  ) {
    if (!/^[0-9]$/.test(digit)) {
      return;
    }

    // Non esiste una posizione 0.
    if (
      numericJumpRef.current === "" &&
      digit === "0"
    ) {
      return;
    }

    const candidate =
      numericJumpRef.current + digit;

    const position =
      Number(candidate);

    // Non permettiamo al buffer di superare
    // il numero reale di elementi disponibili.
    if (
      !Number.isInteger(position) ||
      position < 1 ||
      position > filtered.length
    ) {
      return;
    }

    numericJumpRef.current =
      candidate;

    setNumericJump(
      candidate
    );

    setSelectedIndex(
      position - 1
    );

    if (
      numericJumpTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        numericJumpTimerRef.current
      );
    }

    numericJumpTimerRef.current =
      window.setTimeout(() => {
        numericJumpRef.current = "";
        setNumericJump("");
        numericJumpTimerRef.current =
          null;
      }, 1000);
  }

  function handleKeyboard(
    _event: React.KeyboardEvent
  ) {
    // Navigation is handled by the global window listener.
  }

  return (
    <div
      ref={appRootRef}
      className="app"
      tabIndex={-1}
      onKeyDown={
        handleKeyboard
      }
    >
      <aside>
        <div className="brand clipdeck-brand">
          <img
            className="clipdeck-brand-icon"
            src="/clipboard-tray.png"
            alt=""
          />
          <div className="clipdeck-brand-copy">
            <strong>Clipdeck</strong>
            <small>Clipboard History</small>
          </div>
        </div>

        <button
          className={
            page === "history"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("history")
          }
        >
          <span>History</span>
          <span>
            {items.length}
          </span>
        </button>

        <button
          className={
            page === "settings"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("settings")
          }
        >
          <span>Settings</span>
        </button>

        <div className="status">
          <span
            className={
              monitoring
                ? "dot"
                : "dot waiting"
            }
          />

          <div>
            <strong>
              Clipboard monitoring
            </strong>

            <small>
              {monitoring
                ? "Running locally"
                : "Waiting for first copy"}
            </small>
          </div>
        </div>
      </aside>

      <main>
        {page === "history" ? (
          <>
            <header>
              <div>
                <div className="eyebrow">
                  CLIPDECK
                </div>

                <h1>
                  Clipboard History
                </h1>

                <p>
                  Recent clipboard
                  items stored locally.
                </p>
              </div>

              <div className="shortcut">
                Open
                <kbd>
                  {displayShortcut(
                    shortcutBinding
                  )}
                </kbd>
              </div>
            </header>

            <div className="toolbar">
              <input
                ref={searchRef}
                placeholder="Search clipboard..."
                value={query}
                onChange={(event) => {
                  setQuery(
                    event.target.value
                  );
                  setSelectedIndex(
                    0
                  );
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();

                    searchRef.current?.blur();
                    appRootRef.current?.focus();
                  }
                }}
              />

              <div className="history-toolbar-actions">
                <button
                  className={
                    monitoringPaused
                      ? "secondary monitoring-paused"
                      : "secondary"
                  }
                  onClick={() =>
                    setMonitoringPaused(
                      (current) => !current
                    )
                  }
                >
                  {monitoringPaused
                    ? "Resume monitoring"
                    : "Pause monitoring"}
                </button>

                <select
                  className="history-order-select"
                  value={historyOrder}
                  title="History order"
                  onChange={(event) =>
                    setHistoryOrder(
                      event.target.value as HistoryOrder
                    )
                  }
                >
                  <option value="newest">
                    Newest first
                  </option>

                  <option value="oldest">
                    Oldest first
                  </option>
                </select>

                <button
                  className="secondary"
                  onClick={
                    clearHistory
                  }
                >
                  Clear history
                </button>
              </div>
            </div>

            {storageNotice && (
              <div
                className="storage-notice"
                role="status"
              >
                <span>
                  {storageNotice}
                </span>

                <button
                  onClick={() =>
                    setStorageNotice("")
                  }
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="keyboard-row">
              <div className="keyboard-hint">
              ↑ ↓ Select
              <span>•</span>
              Type number to Jump
              <span>•</span>
              Enter pastes
              <span>•</span>
              Esc closes
              </div>

              {numericJump && (
                <div className="jump-indicator">
                  Jump: {numericJump}
                </div>
              )}
            </div>

            <div className="history">
              {filtered.length ===
              0 ? (
                <div className="empty">
                  <div className="empty-icon">
                    ⌘C
                  </div>

                  <h2>
                    No clipboard
                    items
                  </h2>

                  <p>
                    Copy something
                    and it will
                    appear here.
                  </p>
                </div>
              ) : (
                filtered.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      ref={(element) => {
                        itemRefs.current[index] =
                          element;
                      }}
                      className={
                        index ===
                        selectedIndex
                          ? "item selected"
                          : "item"
                      }
                      key={item.id}
                      onMouseEnter={() =>
                        setSelectedIndex(
                          index
                        )
                      }
                      onDoubleClick={() =>
                        pasteItem(
                          item
                        )
                      }
                    >
                      <div
                        className="number"
                        title={`History position ${index + 1}`}
                      >
                        {index + 1}
                      </div>

                      <div className="content">
                        <div className="text">
                          {
                            item.content
                          }
                        </div>

                        <div className="meta">
                          <span>
                            {
                              item.type
                            }
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {relativeTime(
                              item.createdAt
                            )}
                          </span>

                          <span>•</span>

                          <span
                            className="history-id"
                            title="Chronological event ID"
                          >
                            ID {item.sequenceNumber}
                          </span>

                          {item.pinned && (
                            <>
                              <span>
                                •
                              </span>
                              <span>
                                Pinned
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="actions">
                        <button
                          onClick={() =>
                            pasteItem(
                              item
                            )
                          }
                        >
                          Paste
                        </button>

                        <button
                          onClick={() =>
                            togglePin(
                              item.id
                            )
                          }
                        >
                          {item.pinned
                            ? "Unpin"
                            : "Pin"}
                        </button>

                        <button
                          onClick={() =>
                            deleteItem(
                              item.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </>
        ) : (
          <>
            <header>
              <div>
                <div className="eyebrow">
                  CLIPDECK
                </div>

                <h1>Settings</h1>

                <p>
                  Configure desktop
                  behaviour and
                  clipboard preferences.
                </p>
              </div>
            </header>

            <div className="settings">
              <div className="setting">
                <div>
                  <h3>
                    Open history
                    shortcut
                  </h3>

                  <p>
                    Click the shortcut
                    field, then press
                    the combination
                    you want.
                  </p>

                  {shortcutError && (
                    <div className="shortcut-error">
                      {
                        shortcutError
                      }
                    </div>
                  )}
                </div>

                <button
                  className={
                    recordingShortcut
                      ? "shortcut-recorder recording"
                      : "shortcut-recorder"
                  }
                  onClick={() => {
                    setShortcutError(
                      ""
                    );
                    setShortcutPreview("");
                    setRecordingShortcut(
                      true
                    );
                  }}
                >
                  {recordingShortcut
                    ? shortcutPreview || "Press shortcut..."
                    : displayShortcut(
                        shortcutBinding
                      )}
                </button>
              </div>

              <div className="setting">
                <div>
                  <h3>
                    History size
                  </h3>

                  <p>
                    Maximum number of
                    clipboard entries
                    to retain.
                  </p>
                </div>

                <select
                  value={
                    historyLimit
                  }
                  onChange={(event) =>
                    setHistoryLimit(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="25">
                    25 items
                  </option>
                  <option value="50">
                    50 items
                  </option>
                  <option value="100">
                    100 items
                  </option>
                  <option value="250">
                    250 items
                  </option>
                  <option value="500">
                    500 items
                  </option>
                </select>
              </div>

              <div className="setting">
                <div>
                  <h3>Pause monitoring</h3>

                  <p>
                    Stop recording new clipboard
                    content without quitting Clipdeck.
                  </p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={monitoringPaused}
                    onChange={(event) =>
                      setMonitoringPaused(
                        event.target.checked
                      )
                    }
                  />
                  <span />
                </label>
              </div>

              <div className="setting">
                <div>
                  <h3>History retention</h3>

                  <p>
                    Automatically remove old
                    non-pinned clipboard entries.
                  </p>
                </div>

                <select
                  value={retentionPeriod}
                  onChange={(event) =>
                    setRetentionPeriod(
                      event.target
                        .value as RetentionPeriod
                    )
                  }
                >
                  <option value="forever">
                    Forever
                  </option>

                  <option value="1">
                    1 day
                  </option>

                  <option value="7">
                    7 days
                  </option>

                  <option value="30">
                    30 days
                  </option>
                </select>
              </div>

              <div className="setting">
                <div>
                  <h3>
                    Clear history when quitting
                  </h3>

                  <p>
                    Delete all clipboard history
                    when Clipdeck is explicitly quit.
                    Closing the window does not clear it.
                  </p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={
                      clearHistoryOnQuit
                    }
                    onChange={(event) =>
                      setClearHistoryOnQuit(
                        event.target.checked
                      )
                    }
                  />
                  <span />
                </label>
              </div>

              <div className="privacy-disclosure">
                <strong>
                  Sensitive clipboard content
                </strong>

                <p>
                  Clipdeck stores textual clipboard
                  history locally and unencrypted.
                  Passwords, API keys, one-time codes
                  and other secrets may be recorded
                  when copied. Pause monitoring before
                  copying sensitive information.
                </p>

                <p>
                  Individual clipboard entries larger
                  than 256 KB are not stored.
                </p>
              </div>

              <div className="setting">
                <div>
                  <h3>History order</h3>

                  <p>
                    Choose the chronological
                    direction of the list.
                  </p>
                </div>

                <select
                  value={historyOrder}
                  onChange={(event) =>
                    setHistoryOrder(
                      event.target.value as HistoryOrder
                    )
                  }
                >
                  <option value="newest">
                    Newest first
                  </option>

                  <option value="oldest">
                    Oldest first
                  </option>
                </select>
              </div>

              <div className="setting">
                <div>
                  <h3>Window height</h3>
                  <p>Width is fixed. Choose the vertical workspace.</p>
                </div>

                <select
                  value={windowHeight}
                  onChange={(event) =>
                    setWindowHeight(Number(event.target.value))
                  }
                >
                  <option value={600}>Compact - 600 px</option>
                  <option value={700}>Standard - 700 px</option>
                  <option value={800}>Tall - 800 px</option>
                  <option value={900}>Extra tall - 900 px</option>
                </select>
              </div>

              <div className="setting">
                <div>
                  <h3>Appearance</h3>
                  <p>Follow the operating system or force a theme.</p>
                </div>

                <select
                  value={appearance}
                  onChange={(event) =>
                    setAppearance(event.target.value as AppearanceMode)
                  }
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="setting">
                <div>
                  <h3>Accent color</h3>
                  <p>System follows the native accent when available.</p>
                </div>

                <div className="accent-control">
                  <span className="accent-preview" aria-hidden="true" />

                  <select
                    value={accent}
                    onChange={(event) =>
                      setAccent(event.target.value as AccentMode)
                    }
                  >
                    <option value="system">System</option>
                    <option value="cyan">Cyan</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="pink">Pink</option>
                  </select>
                </div>
              </div>

              <div className="setting">
                <div>
                  <h3>
                    Launch at login
                  </h3>

                  <p>
                    Automatically
                    start Clipdeck
                    when you sign in.
                  </p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    disabled={
                      !autostartReady
                    }
                    checked={
                      launchAtLogin
                    }
                    onChange={(event) =>
                      changeLaunchAtLogin(
                        event.target
                          .checked
                      )
                    }
                  />
                  <span />
                </label>
              </div>

              <div className="setting">
                <div>
                  <h3>
                    {isMac
                      ? "Show app in Dock"
                      : "Show app in taskbar"}
                  </h3>

                  <p>
                    {isMac
                      ? "Disable this to run Clipdeck as a menu bar application."
                      : "Disable this to keep Clipdeck only in the system tray."}
                  </p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={
                      showInDock
                    }
                    onChange={(event) =>
                      changeDockVisibility(
                        event.target
                          .checked
                      )
                    }
                  />
                  <span />
                </label>
              </div>

              {isMac && (
                <div className="setting">
                  <div>
                    <h3>Accessibility permission</h3>

                    <p>
                      Required for automatic paste
                      into the previously active app.
                    </p>
                  </div>

                  <div className="permission-control">
                    <span
                      className={
                        accessibilityGranted
                          ? "permission-badge granted"
                          : "permission-badge required"
                      }
                    >
                      {accessibilityGranted === null
                        ? "Checking..."
                        : accessibilityGranted
                          ? "Granted"
                          : "Required"}
                    </span>

                    {!accessibilityGranted && (
                      <button
                        className="permission-button"
                        onClick={() =>
                          void grantAccessibilityPermission()
                        }
                      >
                        Grant permission
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="setting">
                <div>
                  <h3>
                    Menu bar /
                    System tray
                  </h3>

                  <p>
                    Clipdeck
                    continues running
                    when its window
                    is closed.
                  </p>
                </div>

                <span className="badge">
                  Always enabled
                </span>
              </div>

              <div className="setting">
                <div>
                  <h3>Storage</h3>

                  <p>
                    Clipboard history
                    remains on this
                    computer.
                  </p>
                </div>

                <span className="badge">
                  Local only
                </span>
              </div>
            </div>

            <div className="vibe-quote">
              “Vibe coded. Debugged until the vibes became deterministic.”
              <span>Clipdeck</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
