export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "default-secret-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  // Platform built-in variables (not needed in .env.example)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  appId: process.env.VITE_APP_ID ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://api.manus.im",
};
