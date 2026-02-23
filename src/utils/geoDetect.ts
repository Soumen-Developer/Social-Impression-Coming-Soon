/**
 * Silent Geo Detection Utility
 * 
 * Fetches the user's FULL location data silently from the browser.
 * No popups, no alerts, no permissions — just a background fetch.
 * Stores the complete raw API response for the Google Sheet.
 * 
 * Uses our own PHP proxy (/geo.php) to avoid CORS issues.
 */

export interface GeoData {
    ip: string;
    city: string;
    region: string;
    country: string;
    country_code: string;
    /** The complete raw API response — stored as-is in the sheet */
    raw: Record<string, unknown>;
}

const EMPTY_GEO: GeoData = {
    ip: '',
    city: '',
    region: '',
    country: '',
    country_code: '',
    raw: {},
};

// Cache so we only fetch once per session
let cachedGeo: GeoData | null = null;
let fetchPromise: Promise<GeoData> | null = null;

/**
 * Silently detect the user's geo location.
 * Calls our PHP proxy which fetches from ipapi.co server-side (no CORS).
 * Returns cached result on subsequent calls.
 * Never throws — returns empty data on failure.
 */
export function detectGeo(): Promise<GeoData> {
    if (cachedGeo) return Promise.resolve(cachedGeo);
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${apiUrl}/geo.php`, {
                signal: AbortSignal.timeout(8000),
            });

            if (!res.ok) return EMPTY_GEO;

            const data = await res.json();

            const result: GeoData = {
                ip: data.ip || data.ipAddress || '',
                city: data.city || data.cityName || '',
                region: data.region || data.regionName || '',
                country: data.country_name || data.countryName || '',
                country_code: (data.country_code || data.countryCode || '').toLowerCase(),
                raw: data,
            };

            if (result.country) {
                cachedGeo = result;
            }

            return result;
        } catch {
            return EMPTY_GEO;
        }
    })();

    return fetchPromise;
}
