/**
 * Domain Utilities
 *
 * Single source of truth for the production URL.
 * All API calls use relative paths only — never absolute external URLs.
 */

// ─── Official Production URL ───────────────────────────────────────────────────

export const PRODUCTION_URL = 'https://base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app' as const;
export const PRODUCTION_HOSTNAME = 'base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app' as const;

// ─── Domain Info ──────────────────────────────────────────────────────────────

export interface DomainInfo {
  hostname:    string;
  isProduction: boolean;
  fullUrl:     string;
}

export function getCurrentDomain(): DomainInfo {
  if (typeof window === 'undefined') {
    return {
      hostname:    PRODUCTION_HOSTNAME,
      isProduction: true,
      fullUrl:     PRODUCTION_URL,
    };
  }

  const hostname = window.location.hostname;

  return {
    hostname,
    isProduction: hostname === PRODUCTION_HOSTNAME,
    fullUrl:      window.location.origin,
  };
}

/**
 * All backend calls must use relative paths so they always resolve
 * to the same origin as the frontend — regardless of which domain
 * the request arrives from.
 */
export function getApiUrl(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

export function verifyApprovedDomain(): boolean {
  const domain = getCurrentDomain();
  if (!domain.isProduction) {
    console.warn('[domain] Running on non-production hostname:', domain.hostname);
    console.warn('[domain] Official production URL:', PRODUCTION_URL);
    return false;
  }
  return true;
}

export function logDomainInfo(): void {
  const domain = getCurrentDomain();
  console.log('[domain] hostname:', domain.hostname);
  console.log('[domain] isProduction:', domain.isProduction);
  console.log('[domain] origin:', domain.fullUrl);
}
