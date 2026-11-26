"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { IconButton } from "./Button";

export function CopyButton({ value, label = "Copy", size = "sm" }: { value: string; label?: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <IconButton
      size={size}
      label={copied ? "Copied" : label}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => setCopied(true), () => undefined);
      }}
    >
      {copied ? <Check size={15} className="text-brand" /> : <Copy size={15} />}
    </IconButton>
  );
}
