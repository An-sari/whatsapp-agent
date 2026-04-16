export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime.
export const getLoginUrl = () => {
  // For standalone deployment, we can use a local login or just return a placeholder
  // if authentication is bypassed for now.
  return "/login";
};
