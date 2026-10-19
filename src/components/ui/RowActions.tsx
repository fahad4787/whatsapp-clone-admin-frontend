"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export type RowAction = {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  icon?: ReactNode;
};

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = 152;
    const left = Math.min(Math.max(8, rect.right - menuW), window.innerWidth - menuW - 8);
    const top = rect.bottom + 4;
    setCoords({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (actions.length === 0) return null;

  const menu =
    open && coords
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[60] min-w-[9.5rem] overflow-hidden rounded-[var(--radius-sm)] border border-bp-border bg-white py-1 shadow-[var(--shadow-lift)]"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  action.tone === "danger"
                    ? "text-bp-danger hover:bg-red-50"
                    : "text-bp-ink hover:bg-[#f4f7f5]"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick();
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        type="button"
        className="bp-icon-btn"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>
      {menu}
    </div>
  );
}
