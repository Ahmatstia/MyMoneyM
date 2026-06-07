const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const getJakartaDateKey = (date = new Date()): string => {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
};

const dateKeyToDayNumber = (dateKey: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcTime = Date.UTC(year, month - 1, day);

  if (!Number.isFinite(utcTime)) return null;
  return Math.floor(utcTime / DAY_MS);
};

export const normalizeCheckIns = (checkIns: string[] = []): string[] => {
  return Array.from(
    new Set(
      checkIns.filter((dateKey) => dateKeyToDayNumber(dateKey) !== null),
    ),
  ).sort();
};

export const calculateDailyCheckInStreak = (
  checkIns: string[] = [],
  todayKey = getJakartaDateKey(),
  graceDays = 1,
): number => {
  const normalized = normalizeCheckIns(checkIns);
  const checkedInDays = new Set(
    normalized
      .map((dateKey) => dateKeyToDayNumber(dateKey))
      .filter((day): day is number => day !== null),
  );

  const today = dateKeyToDayNumber(todayKey);
  if (today === null || !checkedInDays.has(today)) return 0;

  let streak = 0;
  let cursor = today;
  let graceLeft = graceDays;

  while (cursor >= 0) {
    if (checkedInDays.has(cursor)) {
      streak += 1;
      cursor -= 1;
      continue;
    }

    if (graceLeft > 0 && checkedInDays.has(cursor - 1)) {
      graceLeft -= 1;
      cursor -= 1;
      continue;
    }

    break;
  }

  return streak;
};
