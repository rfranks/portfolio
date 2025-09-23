import type { JobApplication } from "@/types";

interface InterviewApplication
  extends Pick<
    JobApplication,
    "id" | "role" | "interviewDateTime" | "interviewLocation"
  > {}

interface InterviewToIcsOptions {
  /** Duration in minutes for the interview event. Defaults to 60 minutes. */
  durationMinutes?: number;
  /** Timezone identifier to annotate the calendar invite with. */
  timeZone?: string;
  /** Function that returns the current date for deterministic testing. */
  now?: () => Date;
}

export interface InterviewIcsResult {
  /** Raw ICS content. */
  content: string;
  /** Suggested filename for the invite. */
  fileName: string;
}

const DEFAULT_DURATION_MINUTES = 60;
const PROD_ID = "-//TalentForge//Interview Invite//EN";

const sanitizeFileSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeIcsText = (value: string | undefined | null): string => {
  if (!value) {
    return "";
  }
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
};

const formatUtc = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");
  const seconds = `${date.getUTCSeconds()}`.padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const getLocalTimeZone = (): string | undefined => {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return resolved || undefined;
  } catch {
    return undefined;
  }
};

const formatInTimeZone = (date: Date, timeZone: string): string => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const year = lookup("year");
  const month = lookup("month");
  const day = lookup("day");
  const hour = lookup("hour");
  const minute = lookup("minute");
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const createFileName = (application: InterviewApplication): string => {
  const segments = [
    sanitizeFileSegment(application.role.company || ""),
    sanitizeFileSegment(application.role.title || ""),
  ].filter(Boolean);
  const suffix = segments.length > 0 ? segments.join("-") : "invite";
  return `interview-${suffix}.ics`;
};

const buildSummary = (application: InterviewApplication): string => {
  const title = application.role.title?.trim();
  const company = application.role.company?.trim();
  if (title && company) {
    return `Interview: ${title} at ${company}`;
  }
  if (title) {
    return `Interview: ${title}`;
  }
  if (company) {
    return `Interview at ${company}`;
  }
  return "Interview";
};

const buildDescription = (
  application: InterviewApplication,
  start: Date,
  timeZone: string,
): string => {
  const summary = buildSummary(application);
  const localTime = formatInTimeZone(start, timeZone);
  const location = application.interviewLocation?.trim();
  const details: string[] = [summary, `Scheduled for ${localTime} (${timeZone})`];
  if (location) {
    details.push(`Location: ${location}`);
  }
  return details.join("\n");
};

const ensureDuration = (value?: number): number => {
  if (!value || Number.isNaN(value) || value <= 0) {
    return DEFAULT_DURATION_MINUTES;
  }
  return value;
};

const parseInterviewDate = (value: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

export function interviewToICS(
  application: InterviewApplication,
  options: InterviewToIcsOptions = {},
): InterviewIcsResult | null {
  const raw = application.interviewDateTime;
  if (!raw) {
    return null;
  }
  const start = parseInterviewDate(raw);
  if (!start) {
    return null;
  }

  const nowFn = options.now ?? (() => new Date());
  const duration = ensureDuration(options.durationMinutes);
  const end = new Date(start.getTime() + duration * 60_000);
  const dtStamp = nowFn();

  const timeZone = options.timeZone || getLocalTimeZone() || "UTC";
  const summary = buildSummary(application);
  const description = buildDescription(application, start, timeZone);
  const location = escapeIcsText(application.interviewLocation?.trim());
  const uid = `${application.id || "application"}-${start.getTime()}@talentforge`; // ensures stable per application/time
  const fileName = createFileName(application);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PROD_ID}`,
    "CALSCALE:GREGORIAN",
    `X-WR-TIMEZONE:${timeZone}`,
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `DTSTAMP:${formatUtc(dtStamp)}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
  ];

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return {
    content: `${lines.join("\r\n")}\r\n`,
    fileName,
  };
}
