"use client";

type DataPoint = { date: string; score: number; analysisId: string };

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

export function ScoreTrendChart({ data, projectId }: { data: DataPoint[]; projectId: string }) {
  if (data.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#111111]">
        <p className="text-xs text-[#606060]">Run at least 2 analyses to see a trend.</p>
      </div>
    );
  }

  const W = 560;
  const H = 120;
  const pad = { top: 16, right: 16, bottom: 28, left: 32 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const minScore = Math.max(0, Math.min(...data.map((d) => d.score)) - 10);
  const maxScore = Math.min(100, Math.max(...data.map((d) => d.score)) + 10);
  const range = maxScore - minScore || 10;

  const points = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * innerW,
    y: pad.top + innerH - ((d.score - minScore) / range) * innerH,
    score: d.score,
    date: d.date,
    analysisId: d.analysisId,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaD =
    pathD +
    ` L ${points[points.length - 1]!.x} ${pad.top + innerH}` +
    ` L ${points[0]!.x} ${pad.top + innerH} Z`;

  const latestScore = data[data.length - 1]!.score;
  const lineColor = scoreColor(latestScore);

  const yTicks = [0, 25, 50, 75, 100].filter((t) => t >= minScore - 5 && t <= maxScore + 5);

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#606060]">
        Score Trend
      </p>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 240 }}
          aria-label="Score trend chart"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Y-axis ticks */}
          {yTicks.map((tick) => {
            const y = pad.top + innerH - ((tick - minScore) / range) * innerH;
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={pad.left + innerW}
                  y2={y}
                  stroke="#1f1f1f"
                  strokeWidth={1}
                />
                <text
                  x={pad.left - 4}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#404040"
                  fontSize={9}
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points + date labels */}
          {points.map((p, i) => (
            <g key={i}>
              <a href={`/projects/${projectId}/analysis?analysisId=${p.analysisId}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="#0a0a0a"
                  stroke={lineColor}
                  strokeWidth={1.5}
                  className="cursor-pointer"
                />
                <title>
                  {p.date}: {p.score}/100
                </title>
              </a>
              {/* X-axis date label — show first, last, and middle */}
              {(i === 0 ||
                i === points.length - 1 ||
                (points.length > 4 && i === Math.floor(points.length / 2))) && (
                <text
                  x={p.x}
                  y={H - 4}
                  textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                  fill="#404040"
                  fontSize={9}
                >
                  {p.date}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
