import { Body, Button, Container, Head, Heading, Hr, Html, Text } from "@react-email/components";

type Props = {
  name: string;
  reconnectUrl: string;
};

export function GitHubTokenExpiredEmail({ name, reconnectUrl }: Props) {
  const firstName = name.split(" ")[0] || name;
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your GitHub connection has expired</Heading>
          <Text style={text}>
            Hi {firstName}, your GitHub OAuth token has been revoked or expired. AI CTO can no
            longer access your repositories until you reconnect your GitHub account.
          </Text>
          <Text style={text}>
            Any scheduled or triggered analyses will fail until you reconnect.
          </Text>
          <Button style={button} href={reconnectUrl}>
            Reconnect GitHub →
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            This happens when you revoke AI CTO&apos;s access in GitHub settings, or after extended
            inactivity. Reconnecting takes under a minute.
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
