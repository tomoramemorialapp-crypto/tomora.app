import type { PlaceReference } from '@/types/profile';

/**
 * Lightweight place lookup backed by OpenStreetMap's Nominatim service. It needs
 * no API key, which keeps the demo turnkey; swap the endpoint for Google Places
 * or Mapbox later by keeping the same `GeocodeResult` shape.
 */
export interface GeocodeResult {
  id: string;
  /** Short, human label for the result (e.g. "Cebu City"). */
  label: string;
  /** Full descriptive address line. */
  fullName: string;
  city?: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
}

interface NominatimItem {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

function cityFrom(a?: NominatimAddress): string | undefined {
  if (!a) return undefined;
  return a.city || a.town || a.village || a.municipality || a.hamlet || a.county;
}

/**
 * Search for places matching `query`. Pass an AbortSignal so callers can cancel
 * superseded keystrokes. Returns [] on any failure so the UI degrades to plain
 * text gracefully.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `${ENDPOINT}?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NominatimItem[];
    return data.map((item) => {
      const city = cityFrom(item.address);
      const region = item.address?.state || item.address?.region;
      const country = item.address?.country;
      return {
        id: String(item.place_id),
        label: item.name || item.display_name.split(',')[0],
        fullName: item.display_name,
        city,
        region,
        country,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      };
    });
  } catch {
    return [];
  }
}

/** Build a structured PlaceReference (with coordinates) from a search result. */
export function resultToPlace(r: GeocodeResult): PlaceReference {
  return {
    displayName: r.fullName,
    city: r.city,
    region: r.region,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    certainty: 'exact',
  };
}

/** A free-text place with no coordinates (the "plain text only" option). */
export function plainTextPlace(text: string): PlaceReference {
  return { displayName: text.trim(), certainty: 'approximate' };
}

/** Whether a place carries precise map coordinates. */
export function hasCoordinates(p?: PlaceReference): p is PlaceReference & { latitude: number; longitude: number } {
  return !!p && typeof p.latitude === 'number' && typeof p.longitude === 'number';
}

/** OpenStreetMap embeddable map URL (interactive, keyless) centered on a pin. */
export function osmEmbedUrl(lat: number, lon: number, delta = 0.02): string {
  const minLon = (lon - delta).toFixed(5);
  const minLat = (lat - delta).toFixed(5);
  const maxLon = (lon + delta).toFixed(5);
  const maxLat = (lat + delta).toFixed(5);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lon.toFixed(5)}`;
}

/** External "open in maps" link for the pin. */
export function osmLink(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`;
}
