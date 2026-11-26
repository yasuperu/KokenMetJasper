// GitHub-token uit het beheer (/jk), alleen in deze browser bewaard
export const TOKEN_KEY = "kmj-gh-token";

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
