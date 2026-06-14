import { ImageResponse } from "next/og";
import { createElement as h } from "react";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          padding: "64px",
          fontFamily: "sans-serif",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          },
        },
        h("div", {
          style: {
            width: "36px",
            height: "36px",
            background: "#3b82f6",
            borderRadius: "8px",
          },
        }),
        h("span", { style: { fontSize: "28px", fontWeight: "700", color: "#f0f0f0" } }, "AI CTO")
      ),
      h(
        "h1",
        {
          style: {
            fontSize: "64px",
            fontWeight: "800",
            color: "#f0f0f0",
            lineHeight: "1.1",
            margin: "0 0 24px 0",
            maxWidth: "800px",
          },
        },
        "Your AI Technical Co-Founder"
      ),
      h(
        "p",
        {
          style: {
            fontSize: "28px",
            color: "#a0a0a0",
            margin: "0",
            maxWidth: "700px",
            lineHeight: "1.4",
          },
        },
        "Analyze your GitHub repo like a senior CTO. Architecture, security, code quality & SaaS readiness in minutes."
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            gap: "16px",
            marginTop: "48px",
          },
        },
        ...["Architecture", "Security", "Code Quality", "SaaS Score"].map((label) =>
          h(
            "div",
            {
              key: label,
              style: {
                background: "#1f1f1f",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "8px 20px",
                fontSize: "18px",
                color: "#606060",
              },
            },
            label
          )
        )
      )
    ),
    { width: 1200, height: 630 }
  );
}
