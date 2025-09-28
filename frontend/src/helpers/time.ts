export function fmt(s?: string) {
  if (!s) return "—";
  const str = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export function minutesRemaining(end?: string) {
  if (!end) return NaN;
  const str = end.includes("T") ? end : end.replace(" ", "T");
  const d = new Date(str);
  const diff = d.getTime() - Date.now();
  return Math.floor(diff / 60000);
}
