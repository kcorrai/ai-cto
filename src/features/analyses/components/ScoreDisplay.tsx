"use client";

import { useLayoutEffect, useRef, useState } from "react";

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (score / 100);
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90" aria-hidden="true">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#1f1f1f" strokeWidth="7" />
      <circle
        cx="56"
        cy="56"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: "stroke-dasharray 0.8s ease-out" }}
      />
    </svg>
  );
}

export function ScoreDisplay({
  score,
  label,
  analysisId,
}: {
  score: number;
  label: string;
  analysisId: string;
}) {
  const color = scoreColor(score);
  const seenKey = `analysis-seen:${analysisId}`;
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadySeen = sessionStorage.getItem(seenKey) === "1";

    if (alreadySeen || prefersReduced) {
      // Move setState into RAF so it's not synchronous in the effect body
      rafRef.current = requestAnimationFrame(() => setDisplayed(score));
      return () => cancelAnimationFrame(rafRef.current);
    }

    const DURATION = 1200;
    let start: number | null = null;

    function tick(ts: number) {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * score));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem(seenKey, "1");
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score, analysisId, seenKey]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <ScoreRing score={score} color={color} />
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-semibold tabular-nums leading-none" style={{ color }}>
            {displayed}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-widest text-[#606060]">/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
