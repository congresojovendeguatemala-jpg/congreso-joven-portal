const TZ = "America/Guatemala";

export function fmtDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d.length === 10 ? d + "T12:00:00Z" : d) : d;
  return new Intl.DateTimeFormat("es-GT", { timeZone: TZ, ...opts }).format(date);
}

export function fmtRange(a?: string | null, b?: string | null) {
  if (!a) return "Fecha por confirmar";
  if (!b || a === b) return fmtDate(a);
  const da = new Date(a + "T12:00:00Z");
  const dbb = new Date(b + "T12:00:00Z");
  if (da.getUTCMonth() === dbb.getUTCMonth() && da.getUTCFullYear() === dbb.getUTCFullYear())
    return `${da.getUTCDate()} al ${fmtDate(b)}`;
  return `${fmtDate(a)} al ${fmtDate(b)}`;
}

export function year(d?: string | null) {
  return d ? d.slice(0, 4) : "";
}
