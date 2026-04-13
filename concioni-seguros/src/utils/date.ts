export function formatDate(d: string): string {
  if (!d) {
    return "—";
  }

  const [year, month, day] = d.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return "—";
  }

  return `${day}/${month}/${year}`;
}

export function getDiffDays(dateStr: string): number {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}
