export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type SessionBridge = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  rotateTokens: (tokens: SessionTokens) => Promise<void>;
  clearSession: () => Promise<void>;
};

let bridge: SessionBridge | null = null;

export function registerSessionBridge(next: SessionBridge): void {
  bridge = next;
}

export function getSessionBridge(): SessionBridge {
  if (!bridge) {
    throw new Error('Session bridge is not registered. Wrap the app in ApiProvider.');
  }
  return bridge;
}
