import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  if (!accessToken) {
    res.status(401).json({ error: "Missing access token" });
    return;
  }

  const startParam = Array.isArray(req.query.start)
    ? req.query.start[0]
    : (req.query.start as string | undefined);
  const start = startParam ? parseInt(startParam, 10) : 0;
  const count = 10;
  const url = `https://api.linkedin.com/v2/messages?q=List&start=${start}&count=${count}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      res
        .status(response.status)
        .json({ error: (data.message as string) || "LinkedIn API error" });
      return;
    }

    const elements: unknown[] = Array.isArray(data.elements)
      ? (data.elements as unknown[])
      : [];

    const messages = elements
      .filter(
        (m): m is Record<string, unknown> =>
          typeof m === "object" && m !== null
      )
      .map((m) => ({
        id:
          typeof m["id"] === "string"
            ? (m["id"] as string)
            : typeof m["eventId"] === "string"
            ? (m["eventId"] as string)
            : Math.random().toString(36).slice(2),
        source: "linkedin",
        sender: typeof m["from"] === "string" ? (m["from"] as string) : "",
        subject: typeof m["subject"] === "string" ? (m["subject"] as string) : "",
        content:
          typeof m["body"] === "string"
            ? (m["body"] as string)
            : typeof m["text"] === "string"
            ? (m["text"] as string)
            : "",
      }));

    const nextStart = start + messages.length;
    const nextPageToken = messages.length === count ? String(nextStart) : undefined;

    res.status(200).json({ messages, nextPageToken });
  } catch {
    res.status(500).json({ error: "Failed to fetch LinkedIn messages" });
  }
}
