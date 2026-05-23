/** Predefined specialist types for business staff (multi-select in staff form). */
export const STAFF_SPECIALIST_OPTIONS = [
  'Hair Stylist',
  'Barber',
  'Colorist',
  'Esthetician',
  'Nail Technician',
  'Makeup Artist',
  'Massage Therapist',
  'Waxing Specialist',
  'Braider',
  'Lash Technician',
] as const;

export type StaffSpecialistOption = (typeof STAFF_SPECIALIST_OPTIONS)[number];

const LEGACY_SPECIALIST_ALIASES: Record<string, StaffSpecialistOption> = {
  stylist: 'Hair Stylist',
  barber: 'Barber',
};

function normalizeSpecialistLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  const exact = STAFF_SPECIALIST_OPTIONS.find((o) => o.toLowerCase() === t.toLowerCase());
  if (exact) return exact;
  const alias = LEGACY_SPECIALIST_ALIASES[t.toLowerCase()];
  if (alias) return alias;
  return t;
}

export function parseSpecialistTypes(role: string, skills?: string[]): string[] {
  const fromSkills = (skills ?? []).map((s) => normalizeSpecialistLabel(s)).filter(Boolean);
  if (fromSkills.length > 0) {
    return Array.from(new Set(fromSkills));
  }
  const parts = role
    .split(',')
    .map((s) => normalizeSpecialistLabel(s))
    .filter(Boolean);
  return Array.from(new Set(parts));
}

export function formatSpecialistTypes(types: string[]): string {
  const clean = types.map((t) => t.trim()).filter(Boolean);
  return clean.length > 0 ? clean.join(', ') : '';
}
