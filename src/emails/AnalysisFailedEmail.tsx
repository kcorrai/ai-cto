import { Body, Button, Container, Head, Heading, Hr, Html, Text } from "@react-email/components";

type Props = {
  name: string;
  projectName: string;
  retryUrl: string;
};

export function AnalysisFailedEmail({ name, projectName, retryUrl }: Props) {
  const firstName = name.split(" ")[0] || name;
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Analysis failed for {projectName}</Heading>
          <Text style={text}>
            Hi {firstName}, we ran into an issue analyzing {projectName}. This is usually caused by
            a temporary infrastructure problem or an unusually large repository.
          </Text>
          <Text style={text}>
            Your analysis credits have not been deducted — you can retry at no cost.
          </Text>
          <Button style={button} href={retryUrl}>
            Retry analysis →
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            If this keeps happening, reply to this email and we&apos;ll investigate.
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
const text = { color: "#a0a0a0", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px 0" };
const button = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
};
const hr = { borderColor: "#2a2a2a", margin: "28px 0 20px 0" };
const footer = { color: "#606060", fontSize: "12px", margin: 0 };
