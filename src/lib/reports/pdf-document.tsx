import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportAnalysis } from "./fetch-analysis";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#71717a",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#0a0a0a",
    color: "#e0e0e0",
    padding: 40,
    fontSize: 10,
  },
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: "#0a0a0a",
    color: "#e0e0e0",
    padding: 60,
    fontSize: 10,
    flexDirection: "column",
    justifyContent: "center",
  },
  brand: { fontSize: 11, color: "#3b82f6", letterSpacing: 2, marginBottom: 40 },
  projectName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#f0f0f0", marginBottom: 8 },
  subheading: { fontSize: 12, color: "#a0a0a0", marginBottom: 40 },
  scoreBox: {
    backgroundColor: "#111111",
    borderRadius: 8,
    padding: 24,
    marginBottom: 16,
  },
  scoreNumber: { fontSize: 48, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  scoreLabel: { fontSize: 11, letterSpacing: 1 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#f0f0f0",
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 4,
  },
  summaryText: { lineHeight: 1.6, color: "#c0c0c0" },
  moduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  moduleName: { color: "#a0a0a0" },
  moduleScore: { fontFamily: "Helvetica-Bold" },
  findingCard: {
    backgroundColor: "#111111",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  findingTitle: { fontFamily: "Helvetica-Bold", color: "#f0f0f0", marginBottom: 4, fontSize: 10 },
  findingMeta: { color: "#606060", fontSize: 8, marginBottom: 4 },
  findingDesc: { color: "#c0c0c0", lineHeight: 1.5, marginBottom: 4 },
  findingRec: {
    backgroundColor: "#0a0a0a",
    borderRadius: 3,
    padding: 6,
    color: "#a0c4ff",
    lineHeight: 1.5,
  },
  severityText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginRight: 6,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#404040",
    fontSize: 8,
  },
});

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

type Props = { data: ReportAnalysis; date: string };

export function AnalysisReport({ data, date }: Props) {
  const color = scoreColor(data.score);
  const sortedModules = [...data.modules].sort((a, b) => a.score - b.score);
  const findings = ["critical", "high", "medium", "low", "info"].flatMap((sev) =>
    data.findings.filter((f) => f.severity === sev)
  );

  return (
    <Document
      title={`AI CTO Report — ${data.projectName}`}
      author="AI CTO"
      subject={`SaaS Score: ${data.score}/100`}
    >
      {/* Cover page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.brand}>AI CTO</Text>
        <Text style={styles.projectName}>{data.projectName}</Text>
        <Text style={styles.subheading}>Technical Analysis Report · {date}</Text>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreNumber, { color }]}>{data.score}</Text>
          <Text style={{ color: "#606060", fontSize: 10, marginBottom: 4 }}>/100</Text>
          <Text style={[styles.scoreLabel, { color }]}>{data.label.toUpperCase()}</Text>
        </View>
        <View style={styles.footer}>
          <Text>AI CTO · aicto.dev</Text>
          <Text>{date}</Text>
        </View>
      </Page>

      {/* Summary + modules */}
      <Page size="A4" style={styles.page}>
        {data.summary ? (
          <>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Module Scores</Text>
        {sortedModules.map((m) => (
          <View key={m.module} style={styles.moduleRow}>
            <Text style={styles.moduleName}>{m.module.replace(/_/g, " ")}</Text>
            <Text style={[styles.moduleScore, { color: scoreColor(m.score) }]}>{m.score}/100</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text>AI CTO · aicto.dev</Text>
          <Text>{date}</Text>
        </View>
      </Page>

      {/* Findings */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Findings ({data.findings.length})</Text>
        {findings.slice(0, 30).map((f, i) => {
          const sevColor = SEVERITY_COLOR[f.severity] ?? "#71717a";
          const modName = f.module.replace(/_/g, " ");
          return (
            <View key={i} style={styles.findingCard}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 4 }}>
                <Text style={[styles.severityText, { color: sevColor }]}>
                  {f.severity.toUpperCase()}
                </Text>
                <Text style={styles.findingTitle}>{f.title}</Text>
              </View>
              <Text style={styles.findingMeta}>
                {modName}
                {f.filePath ? ` · ${f.filePath}` : ""}
              </Text>
              {f.description ? <Text style={styles.findingDesc}>{f.description}</Text> : null}
              {f.recommendation ? (
                <View style={styles.findingRec}>
                  <Text>{f.recommendation}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text>AI CTO · aicto.dev</Text>
          <Text>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
