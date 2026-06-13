"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Bot, Send, Plus, Trash2, LayoutGrid } from "lucide-react";
import { PORTFOLIO_SUGGESTED_PROMPTS } from "@/lib/ai/prompts/portfolio-advisor";

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
  isPro: boolean;
  conversations: Conversation[];
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
  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-left font-semibold">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border border-[#2a2a2a] px-3 py-1.5">{children}</td>;
  },
};

let msgCounter = 0;
function genId() {
  return `msg-${Date.now()}-${++msgCounter}`;
}

export function PortfolioAdvisorChat({ isPro, conversations }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const [convList, setConvList] = useState(conversations);
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
        const res = await fetch("/api/advisor/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
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
          const streamedText = accumulated;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: streamedText } : m))
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
    [isLoading, messages, activeConvId]
  );

  function handleNewConversation() {
    abortRef.current?.abort();
    setMessages([]);
    setActiveConvId(undefined);
    setIsLoading(false);
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

  async function handleDeleteConversation(id: string) {
    await fetch(`/api/advisor/conversations/${id}`, { method: "DELETE" });
    setConvList((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) handleNewConversation();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full">
      {/* Sidebar — history */}
      {isPro && (
        <div className="flex w-56 flex-col border-r border-[#1f1f1f] bg-[#111111]">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] px-3 py-2">
            <span className="text-xs font-medium text-[#888]">History</span>
            <button
              onClick={handleNewConversation}
              className="rounded p-1 text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#aaa]"
              title="New conversation"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convList.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[#555]">No conversations yet</p>
            ) : (
              convList.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-start justify-between gap-1 px-3 py-2 text-xs transition-colors hover:bg-[#1a1a1a] ${activeConvId === conv.id ? "bg-[#1a1a1a] text-[#e0e0e0]" : "text-[#888]"}`}
                >
                  <button
                    onClick={() => setActiveConvId(conv.id)}
                    className="flex-1 truncate text-left"
                  >
                    {conv.title ?? "Untitled"}
                  </button>
                  <button
                    onClick={() => void handleDeleteConversation(conv.id)}
                    className="hidden shrink-0 text-[#555] hover:text-[#ef4444] group-hover:block"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-4 py-2.5">
          <LayoutGrid className="h-4 w-4 text-[#3b82f6]" />
          <span className="text-sm font-medium text-[#e0e0e0]">Portfolio Advisor</span>
          <span className="ml-auto text-xs text-[#555]">Context: all your projects</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Bot className="mb-4 h-10 w-10 text-[#333]" />
              <p className="mb-1 text-sm font-medium text-[#e0e0e0]">Portfolio Advisor</p>
              <p className="mb-6 text-center text-xs text-[#555]">
                Ask me about your entire project portfolio — comparisons, priorities, patterns.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-md">
                {PORTFOLIO_SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="rounded-md border border-[#2a2a2a] px-3 py-2 text-left text-xs text-[#888] transition-colors hover:border-[#3b82f6] hover:text-[#e0e0e0]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-2 mt-0.5 shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a2a3a]">
                        <Bot className="h-3.5 w-3.5 text-[#3b82f6]" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-[#1e3a5f] text-[#e0e0e0]"
                        : "bg-[#1a1a1a] text-[#ccc]"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.content || (isLoading ? "▋" : "")}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-[#1f1f1f] p-3">
          <div className="flex items-end gap-2 rounded-lg border border-[#2a2a2a] bg-[#111111] px-3 py-2 focus-within:border-[#3b82f6]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[#e0e0e0] placeholder-[#555] outline-none"
              style={{ maxHeight: "120px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="shrink-0 rounded p-1 text-[#3b82f6] transition-opacity disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[#444]">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
