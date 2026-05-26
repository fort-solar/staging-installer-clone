import { webcrypto } from "crypto";
import { TextDecoder, TextEncoder } from "util";

describe("installer session cookies", () => {
  it("serializes and verifies signed session snapshots", async () => {
    process.env.FORTSOLAR_INSTALLER_SESSION_SECRET = "installer-ci-session-secret-1234567890";
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
    Object.assign(globalThis, { TextEncoder, TextDecoder });
    jest.resetModules();

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
});
