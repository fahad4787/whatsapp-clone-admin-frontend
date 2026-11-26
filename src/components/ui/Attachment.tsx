"use client";

import { useState } from "react";
import { ExternalLink, FileText, ImageOff, Paperclip } from "lucide-react";
import type { ConversationMessage } from "@/lib/api";
import { fmtBytes } from "@/lib/format";
import { Modal } from "./Modal";

/** Only render links/media for http(s) URLs; anything else (javascript:, data:) stays a plain chip. */
function safeUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function kindOf(m: ConversationMessage): "image" | "video" | "audio" | "file" {
  const mime = (m.attachment_mime ?? "").toLowerCase();
  const t = m.type.toLowerCase();
  if (mime.startsWith("image/") || t === "image" || t === "sticker" || t === "gif") return "image";
  if (mime.startsWith("video/") || t === "video") return "video";
  if (mime.startsWith("audio/") || t === "audio" || t === "voice") return "audio";
  return "file";
}

function FileChip({ m, href }: { m: ConversationMessage; href: string | null }) {
  const label = m.attachment_name ?? m.attachment_mime ?? m.type;
  const size = fmtBytes(m.attachment_size);
  const body = (
    <>
      {href ? <FileText size={15} className="shrink-0 text-muted" aria-hidden /> : <Paperclip size={13} className="shrink-0 text-muted" aria-hidden />}
      <span className="min-w-0 truncate">{label}</span>
      {size ? <span className="shrink-0 text-[11px] text-muted">{size}</span> : null}
      {href ? <ExternalLink size={12} className="shrink-0 text-muted" aria-hidden /> : null}
    </>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-0.5 flex max-w-full items-center gap-1.5 rounded-md bg-black/[0.04] px-2 py-1.5 text-ink-soft hover:text-ink hover:underline"
    >
      {body}
    </a>
  ) : (
    <div className="mb-0.5 flex items-center gap-1.5 text-ink-soft">{body}</div>
  );
}

/** Inline media for a transcript bubble: image thumbnail (click for full size), video/audio player, or file link. */
export function MessageAttachment({ m }: { m: ConversationMessage }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const url = safeUrl(m.attachment_url);
  const thumb = safeUrl(m.attachment_thumbnail_url) ?? url;
  const kind = kindOf(m);

  if (!url) return <FileChip m={m} href={null} />;

  if (kind === "image") {
    if (broken) {
      return (
        <div className="mb-1 flex items-center gap-1.5 rounded-md bg-black/[0.04] px-2 py-1.5 text-[13px] text-muted">
          <ImageOff size={14} aria-hidden /> Image unavailable
          <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-brand-text hover:underline">
            Open
          </a>
        </div>
      );
    }
    const alt = m.attachment_name ? `Image: ${m.attachment_name}` : `Image from ${m.sender_name}`;
    const w = m.attachment_width ?? undefined;
    const h = m.attachment_height ?? undefined;
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-mx-1 -mt-0.5 mb-1 block overflow-hidden rounded-md bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
          aria-label={`View full size: ${alt}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- user media from the API host, not a static asset */}
          <img
            src={thumb ?? url}
            alt={alt}
            width={w}
            height={h}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="block h-auto max-h-72 w-auto min-w-24 max-w-full object-cover sm:max-w-64"
            style={w && h ? { aspectRatio: `${w} / ${h}` } : undefined}
          />
        </button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={m.attachment_name ?? "Image"}
          description={`${m.sender_name}${m.attachment_size ? ` · ${fmtBytes(m.attachment_size)}` : ""}`}
          size="lg"
          footer={
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-text hover:underline"
            >
              Open original <ExternalLink size={13} aria-hidden />
            </a>
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} className="mx-auto block max-h-[60vh] w-auto max-w-full rounded-md" />
        </Modal>
      </>
    );
  }

  if (kind === "video") {
    return (
      <video
        src={url}
        poster={safeUrl(m.attachment_thumbnail_url) ?? undefined}
        controls
        preload="metadata"
        className="-mx-1 -mt-0.5 mb-1 block max-h-72 w-full max-w-full rounded-md bg-black sm:w-64"
      >
        <a href={url}>Download video</a>
      </video>
    );
  }

  if (kind === "audio") {
    return <audio src={url} controls preload="none" className="mb-1 block h-10 w-64 max-w-full" />;
  }

  return <FileChip m={m} href={url} />;
}
