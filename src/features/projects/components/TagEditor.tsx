"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";

const MAX_TAGS = 5;
const MAX_TAG_LEN = 20;

interface Props {
  projectId: string;
  initialTags: string[];
}

export function TagEditor({ projectId, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function save(next: string[]) {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LEN);
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    const next = [...tags, tag];
    setTags(next);
    setInput("");
    save(next);
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    save(next);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
      <p className="mb-3 text-[11px] uppercase tracking-wider text-[#606060]">
        Tags {saving && <span className="ml-1 text-[#3b82f6]">saving…</span>}
      </p>
      <div
        className="flex flex-wrap gap-2 rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 focus-within:border-[#3b82f6]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-[#1e3a5f] px-2.5 py-0.5 text-xs font-medium text-[#93c5fd]"
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 rounded-full hover:text-white"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_TAG_LEN))}
            onKeyDown={onKey}
            onBlur={() => addTag(input)}
            placeholder={tags.length === 0 ? "Add tags (Enter to confirm)" : "Add tag…"}
            className="min-w-[120px] flex-1 bg-transparent text-xs text-[#f0f0f0] placeholder-[#404040] outline-none"
          />
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-[#404040]">
        Up to {MAX_TAGS} tags · {MAX_TAG_LEN} chars each · press Enter or comma to add
      </p>
    </div>
  );
}
