export function ExecutiveSummary({ summary }: { summary: string }) {
  const paragraphs = summary.split(/\n\n+/).filter(Boolean);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#606060]">
        Executive Summary
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-[#a0a0a0]">
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </section>
  );
}
