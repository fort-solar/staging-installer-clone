import { webcrypto } from "crypto";
import { TextDecoder, TextEncoder } from "util";

describe("installer session helpers", () => {
  beforeEach(() => {
    process.env.FORTSOLAR_INSTALLER_SESSION_SECRET = "installer-ci-session-secret-1234567890";
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
    Object.assign(globalThis, { TextEncoder, TextDecoder });
    jest.resetModules();
  });

  it("serializes and verifies signed session snapshots", async () => {
    const sessionModule = await import("@/lib/auth/session");

    const snapshot = sessionModule.createSessionSnapshot(
      {
        session: {
          userId: "user-1",
          email: "installer@example.com",
          fullName: "Jane Installer",
          role: "installer",
          signedInAt: "2026-05-26T00:00:00.000Z",
        },
        user: {
          id: "user-1",
          email: "installer@example.com",
          name: "Jane",
          fullName: "Jane Installer",
          phone: null,
          address: null,
          role: "installer",
          adminRole: null,
          status: "active",
          avatar_url: null,
          emailVerified: true,
          createdAt: "2026-05-26T00:00:00.000Z",
        },
      },
      "installer",
      "2026-05-27T00:00:00.000Z",
    );

    const signed = await sessionModule.serializeSessionSnapshot(snapshot);
    const decoded = await sessionModule.deserializeSessionSnapshot(signed);

    expect(decoded).toEqual(snapshot);
  });

  it("reuses the existing session when a profile update only returns user data", async () => {
    const sessionModule = await import("@/lib/auth/session");

    const snapshot = sessionModule.createSessionSnapshotFromUpdatedUser(
      {
        success: true,
        user: {
          id: "user-1",
          email: "installer@example.com",
          name: "Jane",
          fullName: "Jane Installer",
          phone: "07068619556",
          address: "54 Utang Street Uyo",
          role: "installer",
          adminRole: null,
          status: "active",
          avatar_url: "https://example.com/avatar.png",
          emailVerified: true,
          createdAt: "2026-05-26T00:00:00.000Z",
        },
      },
      {
        userId: "user-1",
        email: "installer@example.com",
        fullName: "Old Installer Name",
        role: "installer",
        signedInAt: "2026-05-26T00:00:00.000Z",
      },
      "2026-05-27T00:00:00.000Z",
      "installer",
    );

    expect(snapshot.session).toEqual({
      userId: "user-1",
      email: "installer@example.com",
      fullName: "Jane Installer",
      role: "installer",
      signedInAt: "2026-05-26T00:00:00.000Z",
      adminRole: null,
    });
    expect(snapshot.user.fullName).toBe("Jane Installer");
    expect(snapshot.user.phone).toBe("07068619556");
    expect(snapshot.expiresAt).toBe("2026-05-27T00:00:00.000Z");
  });
});
