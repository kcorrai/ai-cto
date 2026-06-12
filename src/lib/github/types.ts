export type Repo = {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  language: string | null;
  updatedAt: string;
  defaultBranch: string;
};

export type ReposResponse = {
  personal: Repo[];
  orgs: { login: string; repos: Repo[] }[];
};
