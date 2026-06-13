const LINEAR_GQL = "https://api.linear.app/graphql";

const SEVERITY_PRIORITY: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
  info: 0,
};

async function gql<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(LINEAR_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0]?.message ?? "Linear API error");
  return json.data;
}

export async function getLinearTeams(token: string) {
  const data = await gql<{ teams: { nodes: { id: string; name: string; key: string }[] } }>(
    token,
    `query { teams { nodes { id name key } } }`
  );
  return data.teams.nodes;
}

export async function getLinearProjects(token: string, teamId: string) {
  const data = await gql<{
    team: { projects: { nodes: { id: string; name: string }[] } };
  }>(token, `query($id: String!) { team(id: $id) { projects { nodes { id name } } } }`, {
    id: teamId,
  });
  return data.team.projects.nodes;
}

export async function createLinearIssue(
  token: string,
  {
    teamId,
    projectId,
    title,
    description,
    severity,
    sourceUrl,
  }: {
    teamId: string;
    projectId?: string;
    title: string;
    description?: string;
    severity: string;
    sourceUrl: string;
  }
) {
  const priority = SEVERITY_PRIORITY[severity] ?? 0;
  const fullDescription = [
    description,
    "",
    `---`,
    `**Source:** [View in AI CTO](${sourceUrl})`,
    `**Severity:** ${severity}`,
  ]
    .filter(Boolean)
    .join("\n");

  const data = await gql<{
    issueCreate: { success: boolean; issue: { id: string; identifier: string; url: string } };
  }>(
    token,
    `mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }`,
    {
      input: {
        teamId,
        ...(projectId ? { projectId } : {}),
        title,
        description: fullDescription,
        priority,
      },
    }
  );

  return data.issueCreate.issue;
}
