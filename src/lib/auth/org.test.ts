import { describe, it, expect } from "vitest";
import { mapClerkRole } from "./org";

describe("mapClerkRole", () => {
  it("maps org:owner to owner", () => {
    expect(mapClerkRole("org:owner")).toBe("owner");
  });

  it("maps org:admin to admin", () => {
    expect(mapClerkRole("org:admin")).toBe("admin");
  });

  it("maps org:member to editor", () => {
    expect(mapClerkRole("org:member")).toBe("editor");
  });

  it("empty string falls back to viewer", () => {
    expect(mapClerkRole("")).toBe("viewer");
  });

  it("unknown role falls back to viewer", () => {
    expect(mapClerkRole("org:guest")).toBe("viewer");
    expect(mapClerkRole("unknown")).toBe("viewer");
    expect(mapClerkRole("OWNER")).toBe("viewer");
    expect(mapClerkRole("org:moderator")).toBe("viewer");
  });
});
