import { parseAvailability } from "@/lib/staffAvailability";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function combineDateAndTime(day: Date, timeStr: string): Date {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) {
    d.setHours(10, 30, 0, 0);
    return d;
  }
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  d.setHours(h, min, 0, 0);
  return d;
}

function parseToMinutes(t: string): number {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 540;
  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + mins;
}

export function generateSlotsForDay(
  schedule: { day: string; hours: string }[] | undefined,
  day: Date,
): string[] {
  const defaultSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM",
  ];
  if (!schedule || schedule.length === 0) return defaultSlots;

  const dayName = WEEKDAYS[day.getDay()];
  const matching = schedule.find((s) => s.day.toLowerCase() === dayName.toLowerCase());
  if (!matching) return defaultSlots;

  const hoursStr = matching.hours.trim();
  if (hoursStr.toLowerCase() === "closed") return [];

  const parts = hoursStr.split("-");
  if (parts.length !== 2) return defaultSlots;

  const startMins = parseToMinutes(parts[0].trim());
  let endMins = parseToMinutes(parts[1].trim());
  if (endMins <= startMins) endMins = startMins + 540;

  const slots: string[] = [];
  for (let mins = startMins; mins < endMins; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    slots.push(
      `${String(displayHour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`,
    );
  }
  return slots;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

export function isTimeSlotInPast(day: Date, timeStr: string, now: Date = new Date()): boolean {
  if (!isSameLocalDay(day, now)) return false;
  return combineDateAndTime(day, timeStr).getTime() <= now.getTime();
}

export function filterBookableTimeSlots(
  slots: string[],
  day: Date,
  now: Date = new Date(),
): string[] {
  if (!isSameLocalDay(day, now)) return slots;
  return slots.filter((t) => !isTimeSlotInPast(day, t, now));
}

function staffOffersService(
  member: { serviceIds?: string[] },
  serviceId: string,
): boolean {
  const ids = member.serviceIds;
  if (!ids || ids.length === 0) return true;
  return ids.includes(serviceId);
}

function staffAvailableOnDay(availabilityRaw: string | undefined, day: Date): boolean {
  const raw = (availabilityRaw || "").trim();
  if (!raw) return true;
  const { mode, weekly, dates } = parseAvailability(raw);
  const ymd = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  if (mode === "dates") {
    if (dates.length === 0) return true;
    return dates.includes(ymd);
  }
  if (weekly.length === 0) return true;
  return weekly.includes(day.getDay());
}

/** Next bookable slot label for venue service cards (e.g. "08:30 PM" or tomorrow's "09:00 AM"). */
export function getNextAvailableSlotLabel(
  schedule: { day: string; hours: string }[] | undefined,
  team: { serviceIds?: string[]; availability?: string }[],
  serviceId: string,
  now: Date = new Date(),
): string {
  const staffForService = team.filter((m) => staffOffersService(m, serviceId));
  if (staffForService.length === 0) return "—";

  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const anyStaff = staffForService.some((m) => staffAvailableOnDay(m.availability, d));
    if (!anyStaff) continue;

    const slots = generateSlotsForDay(schedule, d);
    if (slots.length === 0) continue;

    const bookable = filterBookableTimeSlots(slots, d, now);
    if (bookable.length > 0) return bookable[0];
  }
  return "—";
}
