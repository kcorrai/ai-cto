"use client";

import { useReducer, useEffect } from "react";
import { Activity, RefreshCw } from "lucide-react";

type ActivityEvent = {
  id: string;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  targetName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
};

type State = {
  events: ActivityEvent[];
  loading: boolean;
  hasMore: boolean;
  cursor: string | null;
  filterType: string;
};

type Action =
  | { type: "LOAD_START" }
  | {
      type: "LOAD_DONE";
      events: ActivityEvent[];
      nextCursor: string | null;
      hasMore: boolean;
      append: boolean;
    }
  | { type: "SET_FILTER"; filterType: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true };
    case "LOAD_DONE":
      return {
        ...state,
        loading: false,
        events: action.append ? [...state.events, ...action.events] : action.events,
        cursor: action.nextCursor,
        hasMore: action.hasMore,
      };
    case "SET_FILTER":
      return {
        ...state,
        filterType: action.filterType,
        events: [],
        cursor: null,
        hasMore: false,
        loading: true,
      };
    default:
      return state;
  }
}

const INITIAL: State = {
  events: [],
  loading: true,
  hasMore: false,
  cursor: null,
  filterType: "",
};

const EVENT_LABELS: Record<string, string> = {
  analysis_triggered: "ran an analysis on",
  findings_resolved: "resolved findings in",
  project_created: "created project",
  report_exported: "exported a report for",
  member_invited: "invited",
  critical_finding: "New critical finding in",
};

function formatEvent(event: ActivityEvent): string {
  const label = EVENT_LABELS[event.eventType] ?? event.eventType;
  const name = event.user.name ?? event.user.email;
  const target = event.targetName ?? "";
  if (event.eventType === "critical_finding") return `${label} ${target}`;
  if (event.eventType === "member_invited") {
    return `${name} invited ${(event.metadata?.email as string) ?? target} to the team`;
  }
  if (event.eventType === "findings_resolved") {
    const count = event.metadata?.count as number;
    return `${name} resolved ${count} finding${count !== 1 ? "s" : ""} in ${target}`;
  }
  return `${name} ${label} ${target}`.trim();
}

async function apiFetch(
  filterType: string,
  cursor?: string | null
): Promise<{ events: ActivityEvent[]; nextCursor: string | null; hasMore: boolean } | null> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (filterType) params.set("type", filterType);
  try {
    const res = await fetch(`/api/orgs/activity?${params}`);
    if (!res.ok) return null;
    return res.json() as Promise<{
      events: ActivityEvent[];
      nextCursor: string | null;
      hasMore: boolean;
    }>;
  } catch {
    return null;
  }
}

const EVENT_TYPES = [
  { value: "", label: "All events" },
  { value: "analysis_triggered", label: "Analyses" },
  { value: "project_created", label: "Projects" },
  { value: "findings_resolved", label: "Findings" },
  { value: "report_exported", label: "Reports" },
  { value: "member_invited", label: "Invitations" },
  { value: "critical_finding", label: "Critical" },
];

export default function ActivityFeedPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Initial load + polling
  useEffect(() => {
    let alive = true;

    apiFetch(state.filterType).then((data) => {
      if (!alive || !data) return;
      dispatch({ type: "LOAD_DONE", ...data, append: false });
    });

    const interval = setInterval(() => {
      apiFetch(state.filterType).then((data) => {
        if (!alive || !data) return;
        dispatch({ type: "LOAD_DONE", ...data, append: false });
      });
    }, 30_000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [state.filterType]);

  function refresh() {
    dispatch({ type: "LOAD_START" });
    apiFetch(state.filterType).then((data) => {
      if (!data) return;
      dispatch({ type: "LOAD_DONE", ...data, append: false });
    });
  }

  function loadMore() {
    dispatch({ type: "LOAD_START" });
    apiFetch(state.filterType, state.cursor).then((data) => {
      if (!data) return;
      dispatch({ type: "LOAD_DONE", ...data, append: true });
    });
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f0f0]">Activity Feed</h1>
          <p className="mt-1 text-sm text-[#a0a0a0]">Recent team actions across all projects</p>
        </div>
        <button
          onClick={refresh}
          disabled={state.loading}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-[#606060] transition-colors hover:text-[#f0f0f0] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${state.loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {EVENT_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => dispatch({ type: "SET_FILTER", filterType: t.value })}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              state.filterType === t.value
                ? "bg-[#1e3a5f] text-[#3b82f6]"
                : "bg-[#1a1a1a] text-[#606060] hover:text-[#a0a0a0]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {state.loading && state.events.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-5 w-5 animate-spin text-[#606060]" />
        </div>
      ) : state.events.length === 0 ? (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-12 text-center">
          <Activity className="mx-auto mb-3 h-8 w-8 text-[#404040]" />
          <p className="text-sm text-[#606060]">No activity yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {state.events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-[#111111]"
            >
              {event.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.user.avatarUrl}
                  alt=""
                  className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-[10px] font-bold text-[#3b82f6]">
                  {(event.user.name ?? event.user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#f0f0f0]">{formatEvent(event)}</p>
                <p className="text-xs text-[#606060]">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {state.hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={loadMore}
                disabled={state.loading}
                className="text-xs text-[#3b82f6] hover:underline disabled:opacity-50"
              >
                {state.loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
