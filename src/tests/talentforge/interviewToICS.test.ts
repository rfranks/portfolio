import { interviewToICS } from "@/utils/talentforge/interviewToICS";
import type { JobApplication } from "@/types";

describe("interviewToICS", () => {
  const baseApplication: Pick<
    JobApplication,
    "id" | "role" | "interviewDateTime" | "interviewLocation"
  > = {
    id: "app-123",
    role: {
      id: "role-1",
      title: "Senior Engineer",
      company: "Acme Corp",
    },
    interviewDateTime: "2024-05-15T16:00:00.000Z",
    interviewLocation: "Zoom Meeting, ID 123",
  };

  it("creates an ICS invite with summary, timezone, and escaped fields", () => {
    const result = interviewToICS(baseApplication, {
      timeZone: "America/Los_Angeles",
      durationMinutes: 45,
      now: () => new Date("2024-05-10T12:34:56.000Z"),
    });

    expect(result).not.toBeNull();
    const content = result!.content;

    expect(content).toContain("BEGIN:VCALENDAR\r\n");
    expect(content).toContain("PRODID:-//TalentForge//Interview Invite//EN");
    expect(content).toContain("X-WR-TIMEZONE:America/Los_Angeles");
    expect(content).toContain("SUMMARY:Interview: Senior Engineer at Acme Corp");
    expect(content).toContain("DTSTAMP:20240510T123456Z");
    expect(content).toContain("DTSTART:20240515T160000Z");
    expect(content).toContain("DTEND:20240515T164500Z");
    expect(content).toContain("LOCATION:Zoom Meeting\\, ID 123");
    expect(content).toContain(
      "DESCRIPTION:Interview: Senior Engineer at Acme Corp\\nScheduled for 2024-05-15 09:00 (America/Los_Angeles)\\nLocation: Zoom Meeting\\, ID 123",
    );
    expect(result!.fileName).toBe("interview-acme-corp-senior-engineer.ics");
  });

  it("returns null when no interview date is provided", () => {
    const result = interviewToICS({ ...baseApplication, interviewDateTime: undefined });
    expect(result).toBeNull();
  });

  it("returns null for invalid interview dates", () => {
    const result = interviewToICS({ ...baseApplication, interviewDateTime: "invalid-date" });
    expect(result).toBeNull();
  });
});
