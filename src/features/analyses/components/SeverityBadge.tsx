const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "#450a0a", text: "#ef4444", label: "Critical" },
  high: { bg: "#431407", text: "#f97316", label: "High" },
  medium: { bg: "#451a03", text: "#f59e0b", label: "Medium" },
  low: { bg: "#1e3a5f", text: "#3b82f6", label: "Low" },
  info: { bg: "#1a1a1a", text: "#71717a", label: "Info" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info!;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}
