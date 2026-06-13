"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Puzzle,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Loader2,
} from "lucide-react";

type CustomModule = {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  enabled: boolean;
  createdAt: string;
};

type Props = { initial: CustomModule[] };

const PROMPT_PLACEHOLDER = `Analyze this repository for [specific concern].

Return a JSON array where each item has:
- severity: "critical" | "high" | "medium" | "low" | "info"
- title: brief issue title
- description: what the issue is and why it matters
- recommendation: how to fix it
- filePath: (optional) the affected file

Focus on [specific patterns, security issues, compliance requirements, etc.].`;

export function CustomModuleManager({ initial }: Props) {
  const [modules, setModules] = useState<CustomModule[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", prompt: "" });

  function openCreate() {
    setForm({ name: "", description: "", prompt: "" });
    setCreating(true);
    setEditing(null);
  }

  function openEdit(m: CustomModule) {
    setForm({ name: m.name, description: m.description ?? "", prompt: m.prompt });
    setEditing(m.id);
    setCreating(false);
  }

  function cancelForm() {
    setCreating(false);
    setEditing(null);
  }

  async function saveCreate() {
    setLoading("create");
    const res = await fetch("/api/orgs/custom-modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        prompt: form.prompt,
      }),
    });
    if (res.ok) {
      const created = (await res.json()) as CustomModule;
      setModules((prev) => [{ ...created }, ...prev]);
      setCreating(false);
    }
    setLoading(null);
  }

  async function saveEdit(id: string) {
    setLoading(id);
    const res = await fetch(`/api/orgs/custom-modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        prompt: form.prompt,
      }),
    });
    if (res.ok) {
      const updated = (await res.json()) as CustomModule;
      setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      setEditing(null);
    }
    setLoading(null);
  }

  async function toggleEnabled(m: CustomModule) {
    setLoading(m.id + "-toggle");
    const res = await fetch(`/api/orgs/custom-modules/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !m.enabled }),
    });
    if (res.ok) {
      setModules((prev) =>
        prev.map((mod) => (mod.id === m.id ? { ...mod, enabled: !mod.enabled } : mod))
      );
    }
    setLoading(null);
  }

  async function deleteModule(id: string) {
    if (!confirm("Delete this custom module?")) return;
    setLoading(id + "-del");
    const res = await fetch(`/api/orgs/custom-modules/${id}`, { method: "DELETE" });
    if (res.ok) {
      setModules((prev) => prev.filter((m) => m.id !== id));
    }
    setLoading(null);
  }

  const isFormValid = form.name.trim().length > 0 && form.prompt.trim().length >= 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#606060]">{modules.length}/20 custom modules</p>
        {!creating && !editing && modules.length < 20 && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2563eb] transition-colors"
          >
            <Plus className="h-3 w-3" />
            New module
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-[#d0d0d0]">
              {creating ? "New custom module" : "Edit module"}
            </h3>
            <button
              onClick={cancelForm}
              className="text-[#606060] hover:text-[#f0f0f0] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">
                Module name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="HIPAA Compliance Check"
                maxLength={100}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Checks for HIPAA compliance issues"
                maxLength={500}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">
              Analysis prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder={PROMPT_PLACEHOLDER}
              rows={8}
              maxLength={10000}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none font-mono resize-y"
            />
            <p className="mt-1 text-[10px] text-[#404040]">
              Instruct the AI to analyze specific patterns. The AI will receive a sample of the repo
              files.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (creating ? void saveCreate() : void saveEdit(editing!))}
              disabled={!isFormValid || !!loading}
              className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-3 py-2 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {creating ? "Create" : "Save changes"}
            </button>
            <button
              onClick={cancelForm}
              className="rounded-lg px-3 py-2 text-xs text-[#606060] hover:text-[#f0f0f0] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Module list */}
      {modules.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111111] py-16 text-center">
          <Puzzle className="mb-3 h-8 w-8 text-[#404040]" />
          <p className="text-sm font-medium text-[#d0d0d0]">No custom modules yet</p>
          <p className="mt-1 text-xs text-[#606060]">
            Create a module to add custom analysis rules to your pipeline.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white hover:bg-[#2563eb] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create first module
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border bg-[#111111] p-4 transition-colors ${
                m.enabled ? "border-[#1f1f1f]" : "border-[#1a1a1a] opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a]">
                  <Puzzle className="h-4 w-4 text-[#606060]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#f0f0f0] truncate">{m.name}</p>
                    <span
                      className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                        m.enabled ? "bg-green-500/10 text-green-400" : "bg-[#1a1a1a] text-[#404040]"
                      }`}
                    >
                      {m.enabled ? "active" : "disabled"}
                    </span>
                  </div>
                  {m.description && (
                    <p className="mt-0.5 text-xs text-[#606060] truncate">{m.description}</p>
                  )}
                  <p className="mt-1 text-[10px] text-[#404040] font-mono line-clamp-2">
                    {m.prompt.slice(0, 120)}…
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => void toggleEnabled(m)}
                    disabled={loading === m.id + "-toggle"}
                    className="rounded-lg p-1.5 text-[#606060] hover:text-[#f0f0f0] transition-colors disabled:opacity-60"
                    title={m.enabled ? "Disable" : "Enable"}
                  >
                    {loading === m.id + "-toggle" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : m.enabled ? (
                      <ToggleRight className="h-4 w-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(m)}
                    className="rounded-lg p-1.5 text-[#606060] hover:text-[#f0f0f0] transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void deleteModule(m.id)}
                    disabled={loading === m.id + "-del"}
                    className="rounded-lg p-1.5 text-[#606060] hover:text-red-400 transition-colors disabled:opacity-60"
                    title="Delete"
                  >
                    {loading === m.id + "-del" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
