import re

with open('src/auth.ts', 'r') as f:
    content = f.read()

# Add token storage helpers
helpers = """const TOKEN_KEY = 'google_access_token_cache';

const getStoredToken = (): string | null => {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    const { token, expiresAt } = JSON.parse(stored);
    if (Date.now() < expiresAt) {
      return token;
    }
    localStorage.removeItem(TOKEN_KEY);
    return null;
  } catch (e) {
    return null;
  }
};

const storeToken = (token: string) => {
  const expiresAt = Date.now() + 55 * 60 * 1000; // 55 minutes
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }));
};

const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

let isSigningIn = false;
let cachedAccessToken: string | null = getStoredToken();"""

content = content.replace("let isSigningIn = false;\nlet cachedAccessToken: string | null = null;", helpers)

# Update initAuth
old_init = """export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};"""

new_init = """export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedAccessToken = getStoredToken();
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      clearStoredToken();
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};"""
content = content.replace(old_init, new_init)

# Update googleSignIn
old_signin = """    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };"""
new_signin = """    cachedAccessToken = credential.accessToken;
    storeToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };"""
content = content.replace(old_signin, new_signin)

# Update getAccessToken
old_get_token = """export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};"""
new_get_token = """export const getAccessToken = async (): Promise<string | null> => {
  const token = getStoredToken();
  if (token) cachedAccessToken = token;
  return token;
};"""
content = content.replace(old_get_token, new_get_token)

# Update logout
old_logout = """export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};"""
new_logout = """export const logout = async () => {
  await auth.signOut();
  clearStoredToken();
  cachedAccessToken = null;
};"""
content = content.replace(old_logout, new_logout)

with open('src/auth.ts', 'w') as f:
    f.write(content)
print("Patched auth.ts")
