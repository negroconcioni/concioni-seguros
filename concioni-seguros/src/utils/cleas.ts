const CLEAS_COMPANIES = [
  "mapfre",
  "rivadavia",
  "rio uruguay seguros",
  "rus",
  "allianz",
  "sancor",
  "san cristobal",
  "san cristóbal",
  "galicia seguros",
];

export function isCleas(cia: string): boolean {
  const normalized = cia.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return CLEAS_COMPANIES.some((company) => normalized.includes(company));
}
