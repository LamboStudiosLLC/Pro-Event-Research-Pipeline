export function normalizeDomain(url: string): string {
  if (!url) return '';
  try {
    const withProtocol = url.startsWith('http') ? url : `https://${url}`;
    const { hostname } = new URL(withProtocol);
    return hostname.replace(/^www\./, '').toLowerCase().trim();
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
  }
}

function extractYear(name: string): string | null {
  const match = name.match(/\b(20\d{2})\b/);
  return match ? match[1] : null;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(20\d{2})\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isLeadMatch(
  a: { eventName: string; website?: string },
  b: { eventName: string; website?: string }
): boolean {
  const yearA = extractYear(a.eventName);
  const yearB = extractYear(b.eventName);

  // If both names have a year and they differ, it's a different edition — not a match
  if (yearA && yearB && yearA !== yearB) return false;

  const domainA = normalizeDomain(a.website || '');
  const domainB = normalizeDomain(b.website || '');

  const sharedPlatforms = ['eventbrite.com', 'meetup.com', 'eventbee.com'];
  const domainIsUnique = domainA && !sharedPlatforms.includes(domainA);

  if (domainIsUnique && domainA === domainB) return true;

  const nameA = normalizeName(a.eventName);
  const nameB = normalizeName(b.eventName);
  if (nameA && nameB && nameA === nameB) return true;

  // Partial match — catches "CES" vs "CES Trade Show"
  if (nameA && nameB && (nameA.includes(nameB) || nameB.includes(nameA))) return true;

  return false;
}

const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

export function isClaimExpired(claimedAt: any): boolean {
  if (!claimedAt) return true;
  const claimedDate = claimedAt.toDate ? claimedAt.toDate() : new Date(claimedAt);
  return Date.now() - claimedDate.getTime() > THREE_MONTHS_MS;
}
