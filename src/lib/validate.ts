/** Client-side checks that mirror the backend's rules, so admins see problems before saving. */

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4_RE = new RegExp(`^${OCTET}(\\.${OCTET}){3}$`);

/** IPv4 address or IPv4 CIDR (the only forms the firewall matches). */
export function isIpv4OrCidr(value: string): boolean {
  const [ip, bits, ...rest] = value.split("/");
  if (rest.length || !IPV4_RE.test(ip)) return false;
  if (bits === undefined) return true;
  return /^\d{1,2}$/.test(bits) && Number(bits) <= 32;
}

function ipToInt(ip: string) {
  return ip.split(".").reduce((acc, p) => (acc << 8) + Number(p), 0) >>> 0;
}

/** Whether `ip` falls inside `entry` (an IP or CIDR). */
export function ipMatches(ip: string, entry: string): boolean {
  if (!isIpv4OrCidr(entry) || !IPV4_RE.test(ip)) return false;
  const [base, bitsRaw] = entry.split("/");
  const bits = bitsRaw === undefined ? 32 : Number(bitsRaw);
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : ~((1 << (32 - bits)) - 1) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(base) & mask);
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Error for a whole-number field with inclusive bounds, or null when valid. */
export function intError(raw: string, min: number, max?: number): string | null {
  const v = raw.trim();
  if (!v) return "Required.";
  if (!/^-?\d+$/.test(v)) return "Whole numbers only.";
  const n = Number(v);
  if (n < min || (max !== undefined && n > max)) return max === undefined ? `At least ${min}.` : `Between ${min} and ${max}.`;
  return null;
}
