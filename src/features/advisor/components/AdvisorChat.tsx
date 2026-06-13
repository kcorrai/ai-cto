"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string | null;
  messageCount: number;
  updatedAt: Date;
};

type Props = {
  projectId: string;
  isPro: boolean;
  suggestedPrompts: string[];
  conversations: Conversation[];
  onDeleteConversation: (id: string) => void;
};

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded-md bg-[#0a0a0a] p-3 text-xs text-[#e0e0e0]">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        className="rounded bg-[#1a1a1a] px-1 py-0.5 font-mono text-xs text-[#a0c4ff]"
        {...props}
      >
        {children}
      </code>
    );
  },
  p({ children }) {
    return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
  },
  ul({ children }) {
    return <ul className="mb-2 list-disc pl-4 space-y-0.5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-2 list-decimal pl-4 space-y-0.5">{children}</ol>;
  },
  li({ children }) {
    return <li className="text-sm">{children}</li>;
  },
  strong({ children }) {
    return <strong className="font-semibold text-[#f0f0f0]">{children}</strong>;
  },
  a({ href, children }) {
    return (
      <a href={href} className="text-[#3b82f6] underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

let msgCounter = 0;
function genId() {
  return `msg-${Date.now()}-${++msgCounter}`;
}

export function AdvisorChat({
  projectId,
  isPro,
  suggestedPrompts,
  conversations,
  onDeleteConversation,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = { id: genId(), role: "user", content: text };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      const assistantId = genId();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/advisor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            projectId,
            conversationId: activeConvId,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `Error: ${res.status === 429 ? "Rate limit reached. Please wait a moment." : errText || "Something went wrong."}`,
                  }
                : m
            )
          );
          return;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const text = accumulated;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
          );
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: "Connection error. Please try again." } : m
            )
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, projectId, activeConvId]
  );

  function handleNewConversation() {
    abortRef.current?.abort();
    setMessages([]);
    setActiveConvId(undefined);
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSuggestedPrompt(prompt: string) {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full">
      {/* Conversation sidebar — Pro only */}
      {isPro && conversations.length > 0 && (
        <div className="hidden w-56 shrink-0 border-r border-[#1f1f1f] md:flex md:flex-col">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] px-3 py-3">
            <span className="text-[11px] font-medium uppercase tracking-widest text-[#606060]">
              History
            </span>
            <button
              onClick={handleNewConversation}
              className="rounded p-0.5 text-[#606060] transition-colors hover:bg-[#1a1a1a] hover:text-[#a0a0a0]"
              title="New conversation"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between px-3 py-2 ${
                  conv.id === activeConvId
                    ? "bg-[#1a1a1a] text-[#f0f0f0]"
                    : "text-[#a0a0a0] hover:bg-[#141414]"
                } cursor-pointer transition-colors`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <span className="truncate text-xs">{conv.title ?? "Untitled"}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                    if (conv.id === activeConvId) handleNewConversation();
                  }}
                  className="ml-1 shrink-0 rounded p-0.5 text-[#404040] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#ef4444]"
                  title="Delete"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-3">
          <span className="text-sm font-medium text-[#f0f0f0]">AI CTO Advisor</span>
          {!isEmpty && (
            <button
              onClick={handleNewConversation}
              className="text-xs text-[#606060] transition-colors hover:text-[#a0a0a0]"
            >
              New conversation
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm text-[#606060]">
                Ask anything about your codebase. I have the full analysis context.
              </p>
              {suggestedPrompts.length > 0 && (
                <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="rounded-lg border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-left text-xs text-[#a0a0a0] transition-colors hover:border-[#3b82f6] hover:text-[#f0f0f0]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold text-[#3b82f6]">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-[#3b82f6] text-white"
                        : "bg-[#111111] text-[#d0d0d0]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.content ? (
                      <div className="prose-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex gap-1 py-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#404040] [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#404040] [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#404040]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[#1f1f1f] p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your codebase..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#404040] outline-none transition-colors focus:border-[#3b82f6] disabled:opacity-50"
              style={{ minHeight: "38px", maxHeight: "120px" }}
              disabled={isLoading}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-[#404040]">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
