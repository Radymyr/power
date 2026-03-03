interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function parsePart(parts: Intl.DateTimeFormatPart[], type: string): number {
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) {
    throw new Error(`Missing "${type}" in Intl parts`);
  }
  return Number.parseInt(value, 10);
}

export function getZonedDateParts(
  date: Date,
  timeZone = "Europe/Kyiv",
): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: parsePart(parts, "year"),
    month: parsePart(parts, "month"),
    day: parsePart(parts, "day"),
    hour: parsePart(parts, "hour"),
    minute: parsePart(parts, "minute"),
    second: parsePart(parts, "second"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedDateParts(date, timeZone);
  const asUtcTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtcTimestamp - date.getTime();
}

export function getStartOfDayEpochSeconds(
  date: Date,
  timeZone = "Europe/Kyiv",
): number {
  const parts = getZonedDateParts(date, timeZone);
  const utcMidnightGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    0,
    0,
    0,
  );
  const offset = getTimeZoneOffsetMs(new Date(utcMidnightGuess), timeZone);

  return Math.floor((utcMidnightGuess - offset) / 1000);
}
