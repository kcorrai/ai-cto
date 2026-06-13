"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, Send, Pencil, Trash2, Check, X } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    clerkId: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

type Member = { id: string; name: string | null; email: string };

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function canEdit(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
}

export function FindingComments({
  findingId,
  orgMembers = [],
  commentCount = 0,
}: {
  findingId: string;
  orgMembers?: Member[];
  commentCount?: number;
}) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPos, setMentionPos] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function toggle() {
    if (!open && !loaded) {
      fetch(`/api/findings/${findingId}/comments`)
        .then((r) => r.json())
        .then((data: { comments: Comment[] }) => {
          setComments(data.comments);
          setLoaded(true);
        });
    }
    setOpen((v) => !v);
  }

  function onTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setText(val);
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const atMatch = before.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1] ?? "");
      setMentionPos(cursor - atMatch[0].length);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(member: Member) {
    const name = member.name ?? member.email.split("@")[0];
    const before = text.slice(0, mentionPos);
    const after = text.slice(
      textRef.current?.selectionStart ?? mentionPos + (mentionQuery?.length ?? 0) + 1
    );
    setText(before + `@${name} ` + after);
    setMentionQuery(null);
  }

  const filteredMembers =
    mentionQuery !== null
      ? orgMembers.filter((m) =>
          (m.name ?? m.email).toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : [];

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/findings/${findingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = (await res.json()) as { comment: Comment };
      setComments((prev) => [...prev, data.comment]);
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(commentId: string) {
    const res = await fetch(`/api/findings/${findingId}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editText }),
    });
    const data = (await res.json()) as { comment: Comment };
    setComments((prev) => prev.map((c) => (c.id === commentId ? data.comment : c)));
    setEditId(null);
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/findings/${findingId}/comments/${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  const count = loaded ? comments.length : commentCount;

  return (
    <div className="mt-2">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-[#606060] transition-colors hover:text-[#a0a0a0]"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {count > 0 ? `${count} comment${count !== 1 ? "s" : ""}` : "Add comment"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Comments list */}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              {comment.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.user.avatarUrl}
                  alt=""
                  className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-[10px] font-bold text-[#3b82f6]">
                  {(comment.user.name ?? comment.user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0 rounded-lg bg-[#1a1a1a] px-3 py-2">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#f0f0f0]">
                    {comment.user.name ?? comment.user.email}
                  </span>
                  <span className="text-[10px] text-[#606060]">
                    {new Date(comment.createdAt).toLocaleString()}
                    {comment.editedAt && " (edited)"}
                  </span>
                  {user?.id === comment.user.clerkId && (
                    <div className="ml-auto flex gap-1">
                      {canEdit(comment.createdAt) && (
                        <button
                          onClick={() => {
                            setEditId(comment.id);
                            setEditText(comment.content);
                          }}
                          className="rounded p-0.5 text-[#606060] hover:text-[#f0f0f0]"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="rounded p-0.5 text-[#606060] hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editId === comment.id ? (
                  <div className="flex gap-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="flex-1 resize-none rounded border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-1 text-xs text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => saveEdit(comment.id)}
                        className="rounded p-1 text-green-400 hover:bg-green-400/10"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="rounded p-1 text-[#606060] hover:text-[#f0f0f0]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-xs [&>*]:text-[#d0d0d0]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* New comment input */}
          <div className="relative flex gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-[10px] font-bold text-[#3b82f6]">
              {user?.firstName?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="relative flex-1">
              <textarea
                ref={textRef}
                value={text}
                onChange={onTextChange}
                rows={2}
                placeholder="Add a comment… (markdown supported)"
                className="w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#606060] focus:border-[#3b82f6] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void submit();
                  }
                }}
              />

              {/* @mention picker */}
              {filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 z-10 mb-1 w-48 rounded-lg border border-[#2a2a2a] bg-[#161616] py-1 shadow-xl">
                  {filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(m);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                    >
                      {m.name ?? m.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => void submit()}
              disabled={submitting || !text.trim()}
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
