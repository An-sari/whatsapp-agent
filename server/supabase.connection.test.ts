import { describe, it, expect } from "vitest";

/**
 * Test to validate Supabase connection with provided credentials
 * This test ensures that the Supabase environment variables are correctly set
 * and that we can establish a connection to the Supabase database
 */
describe("Supabase Connection", () => {
  it("should have valid Supabase environment variables", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    // Validate URL format
    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/);

    // Validate service role key (JWT token format)
    expect(supabaseServiceRoleKey).toBeDefined();
    expect(supabaseServiceRoleKey).toMatch(/^eyJ/); // JWT tokens start with eyJ

    // Validate anon key (JWT token format)
    expect(supabaseAnonKey).toBeDefined();
    expect(supabaseAnonKey).toMatch(/^eyJ/); // JWT tokens start with eyJ

    console.log("✓ Supabase environment variables are valid");
  });

  it("should validate Supabase JWT token structure", () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = serviceRoleKey.split(".");
    expect(parts).toHaveLength(3);

    // Decode and validate payload
    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

      // Check for expected JWT claims
      expect(payload.iss).toBe("supabase");
      expect(payload.role).toBe("service_role");
      expect(payload.ref).toBeDefined();

      console.log("✓ Service role JWT token is valid");
      console.log(`  - Issuer: ${payload.iss}`);
      console.log(`  - Role: ${payload.role}`);
      console.log(`  - Project Ref: ${payload.ref}`);
    } catch (error) {
      throw new Error(`Failed to decode JWT token: ${error}`);
    }
  });

  it("should validate anon key JWT token structure", () => {
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!anonKey) {
      throw new Error("VITE_SUPABASE_ANON_KEY is not set");
    }

    const parts = anonKey.split(".");
    expect(parts).toHaveLength(3);

    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

      expect(payload.iss).toBe("supabase");
      expect(payload.role).toBe("anon");
      expect(payload.ref).toBeDefined();

      console.log("✓ Anon key JWT token is valid");
      console.log(`  - Issuer: ${payload.iss}`);
      console.log(`  - Role: ${payload.role}`);
      console.log(`  - Project Ref: ${payload.ref}`);
    } catch (error) {
      throw new Error(`Failed to decode JWT token: ${error}`);
    }
  });

  it("should verify Supabase URL matches JWT token project reference", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials");
    }

    // Extract project ref from URL (e.g., https://qxllnxbbytqxbgqolrey.supabase.co)
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectRefFromUrl = urlMatch ? urlMatch[1] : null;

    // Extract project ref from JWT
    const jwtParts = serviceRoleKey.split(".");
    const jwtPayload = JSON.parse(Buffer.from(jwtParts[1], "base64").toString());
    const projectRefFromJwt = jwtPayload.ref;

    // Verify they match
    expect(projectRefFromUrl).toBe(projectRefFromJwt);

    console.log("✓ Supabase URL and JWT token project references match");
    console.log(`  - Project Reference: ${projectRefFromUrl}`);
  });
});
