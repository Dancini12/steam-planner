const CONSENT_KEY = "steam-planner-cookie-consent";
const CONSENT_VERSION = "1.0";

/**
 * Estrutura de consentimento:
 * {
 *   essential: true,         — sempre obrigatório (auth, sessão, armazenamento local)
 *   preferences: boolean,    — ML, histórico de uso, sugestões personalizadas
 *   analytics: boolean,      — métricas de uso anônimas
 *   version: string,
 *   timestamp: string
 * }
 */

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setConsent({ preferences, analytics }) {
  const consent = {
    essential: true,
    preferences: Boolean(preferences),
    analytics: Boolean(analytics),
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch { /* silencioso */ }
  return consent;
}

export function hasConsent() {
  return getConsent() !== null;
}

export function canUsePreferences() {
  const c = getConsent();
  return c?.preferences === true;
}

export function canUseAnalytics() {
  const c = getConsent();
  return c?.analytics === true;
}

export function revokeConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch { /* silencioso */ }
}
