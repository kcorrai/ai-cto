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

type Props = {
  name: string;
  appUrl: string;
};

export function WelcomeEmail({ name, appUrl }: Props) {
  const firstName = name.split(" ")[0] || name;
  return (
    <Html>
      <Head />
      <Preview>Welcome to AI CTO — run your first analysis in 2 minutes.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to AI CTO, {firstName}</Heading>
          <Text style={text}>
            Your AI CTO is ready. Get an instant technical report on any GitHub repository —
            architecture, security, code quality, dependencies, and product readiness — in under 5
            minutes.
          </Text>

          <Section style={steps}>
            <Text style={stepText}>
              <strong>1. Connect GitHub</strong> — authorize AI CTO to read your repositories.
            </Text>
            <Text style={stepText}>
              <strong>2. Create a project</strong> — select any public or private repo.
            </Text>
            <Text style={stepText}>
              <strong>3. Run your first analysis</strong> — your AI CTO report is generated
              automatically.
            </Text>
          </Section>

          <Button style={button} href={`${appUrl}/dashboard`}>
            Run your first analysis →
          </Button>

          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re receiving this because you signed up for AI CTO.{" "}
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
const h1 = { color: "#f0f0f0", fontSize: "22px", fontWeight: "600", margin: "0 0 16px 0" };
const text = { color: "#a0a0a0", fontSize: "15px", lineHeight: "1.6", margin: "0 0 24px 0" };
const steps = {
  backgroundColor: "#0a0a0a",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px 0",
};
const stepText = { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.6", margin: "0 0 8px 0" };
const button = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#2a2a2a", margin: "28px 0 20px 0" };
const footer = { color: "#606060", fontSize: "12px", margin: 0 };
const footerLink = { color: "#606060", textDecoration: "underline" };
