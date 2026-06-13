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
  Row,
  Column,
} from "@react-email/components";

export type DigestProject = {
  name: string;
  repoName: string;
  score: number | null;
  previousScore: number | null;
  findingCount: number;
  analysisId: string | null;
  projectId: string;
};

type Props = {
  name: string;
  appUrl: string;
  weekOf: string;
  projects: DigestProject[];
};

function scoreLabel(score: number): string {
  if (score >= 80) return "Launch-Ready";
  if (score >= 65) return "Nearly There";
  if (score >= 50) return "Needs Work";
  if (score >= 35) return "Early Stage";
  return "Pre-Alpha";
}

function scoreDelta(current: number, prev: number | null): string {
  if (prev === null) return "";
  const delta = current - prev;
  if (delta === 0) return "→ no change";
  return delta > 0 ? `↑ +${delta}` : `↓ ${delta}`;
}

export function WeeklyDigestEmail({ name, appUrl, weekOf, projects }: Props) {
  const firstName = name.split(" ")[0] || name;
  const hasAnalyzed = projects.some((p) => p.score !== null);

  return (
    <Html>
      <Head />
      <Preview>
        {hasAnalyzed
          ? `Your weekly AI CTO report — ${projects.length} project${projects.length !== 1 ? "s" : ""} tracked`
          : "Your weekly AI CTO update — run an analysis to see your score"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>AI CTO</Text>
          <Heading style={h1}>Weekly digest, {firstName}</Heading>
          <Text style={subtitle}>Week of {weekOf}</Text>

          {projects.length === 0 ? (
            <Section style={emptyState}>
              <Text style={text}>No projects yet. Connect a GitHub repo to get started.</Text>
              <Button style={button} href={`${appUrl}/projects/new`}>
                Create your first project →
              </Button>
            </Section>
          ) : (
            <>
              {projects.map((p) => (
                <Section key={p.projectId} style={projectCard}>
                  <Text style={projectName}>{p.repoName}</Text>
                  {p.score !== null ? (
                    <>
                      <Row>
                        <Column>
                          <Text style={scoreValue}>
                            {p.score}
                            <span style={scoreSlash}>/100</span>
                          </Text>
                          <Text style={scoreTag}>{scoreLabel(p.score)}</Text>
                        </Column>
                        <Column style={{ textAlign: "right" as const }}>
                          {p.previousScore !== null && (
                            <Text style={delta}>{scoreDelta(p.score, p.previousScore)}</Text>
                          )}
                          <Text style={findingsText}>
                            {p.findingCount} finding{p.findingCount !== 1 ? "s" : ""}
                          </Text>
                        </Column>
                      </Row>
                      {p.analysisId && (
                        <Link href={`${appUrl}/projects/${p.projectId}/analysis`} style={viewLink}>
                          View report →
                        </Link>
                      )}
                    </>
                  ) : (
                    <Text style={noAnalysis}>No analysis yet</Text>
                  )}
                </Section>
              ))}

              <Button style={button} href={`${appUrl}/dashboard`}>
                Go to dashboard →
              </Button>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            AI CTO — weekly digest.{" "}
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
const brand = {
  color: "#3b82f6",
  fontSize: "13px",
  fontWeight: "600",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: "0 0 16px 0",
};
const h1 = { color: "#f0f0f0", fontSize: "22px", fontWeight: "600", margin: "0 0 4px 0" };
const subtitle = { color: "#606060", fontSize: "13px", margin: "0 0 24px 0" };
const text = { color: "#a0a0a0", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px 0" };
const emptyState = { margin: "0 0 24px 0" };
const projectCard = {
  backgroundColor: "#0a0a0a",
  borderRadius: "8px",
  border: "1px solid #2a2a2a",
  padding: "16px 20px",
  margin: "0 0 12px 0",
};
const projectName = { color: "#f0f0f0", fontSize: "14px", fontWeight: "600", margin: "0 0 12px 0" };
const scoreValue = {
  color: "#3b82f6",
  fontSize: "32px",
  fontWeight: "700",
  margin: "0",
  lineHeight: "1",
};
const scoreSlash = { color: "#606060", fontSize: "16px", fontWeight: "400" };
const scoreTag = {
  color: "#606060",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "4px 0 0 0",
};
const delta = { color: "#a0a0a0", fontSize: "13px", margin: "0 0 4px 0" };
const findingsText = { color: "#606060", fontSize: "12px", margin: 0 };
const noAnalysis = { color: "#606060", fontSize: "13px", margin: "0" };
const viewLink = { color: "#3b82f6", fontSize: "13px", textDecoration: "none" };
const button = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
  margin: "16px 0 0 0",
};
const hr = { borderColor: "#2a2a2a", margin: "28px 0 20px 0" };
const footer = { color: "#606060", fontSize: "12px", margin: 0 };
const footerLink = { color: "#606060", textDecoration: "underline" };
