import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Finding = {
  title: string;
  severity: string;
};

type Props = {
  name: string;
  projectName: string;
  score: number;
  label: string;
  topFindings: Finding[];
  reportUrl: string;
  appUrl: string;
};

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  info: "⚪",
};

export function AnalysisCompleteEmail({
  name,
  projectName,
  score,
  label,
  topFindings,
  reportUrl,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Your ${projectName} analysis is ready — SaaS Score: ${score}/100`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>AI CTO Report</Text>
          <Heading style={h1}>
            {projectName} scored {score}/100
          </Heading>
          <Section style={scoreBox}>
            <Text style={scoreNum}>{String(score)}</Text>
            <Text style={scoreLabel}>{label}</Text>
          </Section>

          {topFindings.length > 0 && (
            <>
              <Text style={sectionTitle}>Top findings</Text>
              {topFindings.slice(0, 3).map((f, i) => (
                <Text key={i} style={findingRow}>
                  {SEVERITY_EMOJI[f.severity] ?? "•"} {f.title}
                </Text>
              ))}
            </>
          )}

          <Button style={button} href={reportUrl}>
            View full report →
          </Button>

          <Hr style={hr} />
          <Text style={footer}>
            This email was sent because you have &ldquo;Email when analysis completes&rdquo;
            enabled.{" "}
            <Link href={`${appUrl}/settings`} style={footerLink}>
              Manage notifications
            </Link>{" "}
            ·{" "}
            <Link href={`${appUrl}/unsubscribe`} style={footerLink}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#0a0a0a", fontFamily: "system-ui, -apple-system, sans-serif" };
const container = {
  maxWidth: "560px",
  margin: "40px auto",
  padding: "32px",
  backgroundColor: "#111111",
  borderRadius: "12px",
  border: "1px solid #2a2a2a",
};
const eyebrow = {
  color: "#606060",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 8px 0",
};
const h1 = { color: "#f0f0f0", fontSize: "22px", fontWeight: "600", margin: "0 0 20px 0" };
const scoreBox = {
  textAlign: "center" as const,
  backgroundColor: "#0a0a0a",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px 0",
};
const scoreNum = {
  color: "#3b82f6",
  fontSize: "56px",
  fontWeight: "700",
  lineHeight: 1,
  margin: "0 0 4px 0",
  fontVariantNumeric: "tabular-nums",
};
const scoreLabel = {
  color: "#3b82f6",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  fontWeight: "600",
  margin: 0,
};
const sectionTitle = {
  color: "#606060",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 8px 0",
};
const findingRow = { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.6", margin: "0 0 4px 0" };
const button = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "20px",
};
const hr = { borderColor: "#2a2a2a", margin: "28px 0 20px 0" };
const footer = { color: "#606060", fontSize: "12px", margin: 0 };
const footerLink = { color: "#606060", textDecoration: "underline" };
