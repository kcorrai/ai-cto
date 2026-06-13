export const SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
export const SCIM_GROUP_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:Group";
export const SCIM_LIST_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
export const SCIM_ERROR_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:Error";
export const SCIM_PATCH_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:PatchOp";

export type ScimUser = {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name?: { givenName?: string; familyName?: string; formatted?: string };
  emails?: Array<{ value: string; primary?: boolean; type?: string }>;
  active: boolean;
  meta: ScimMeta;
};

export type ScimGroup = {
  schemas: string[];
  id: string;
  displayName: string;
  members: Array<{ value: string; display?: string }>;
  meta: ScimMeta;
};

type ScimMeta = {
  resourceType: "User" | "Group";
  created: string;
  lastModified: string;
  location: string;
};

export type ScimListResponse<T> = {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
};

export type ScimPatchOp = {
  schemas: string[];
  Operations: Array<{
    op: "add" | "remove" | "replace";
    path?: string;
    value?: unknown;
  }>;
};

export function scimError(detail: string, status: number): Response {
  return new Response(JSON.stringify({ schemas: [SCIM_ERROR_SCHEMA], detail, status }), {
    status,
    headers: { "Content-Type": "application/scim+json" },
  });
}

export function scimJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/scim+json" },
  });
}
