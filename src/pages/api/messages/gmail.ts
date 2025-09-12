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

  const pageToken = Array.isArray(req.query.pageToken)
    ? req.query.pageToken[0]
    : (req.query.pageToken as string | undefined);

  const url =
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10" +
    (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");

  try {
    const listRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listData = (await listRes.json()) as Record<string, unknown>;
    if (!listRes.ok) {
      res
        .status(listRes.status)
        .json({ error: (listData.error as string) || "Gmail API error" });
      return;
    }

    const messagesArray: unknown[] = Array.isArray(listData.messages)
      ? (listData.messages as unknown[])
      : [];

    const messages = await Promise.all(
      messagesArray
        .filter(
          (m): m is { id: string } =>
            typeof m === "object" &&
            m !== null &&
            typeof (m as Record<string, unknown>).id === "string"
        )
        .map(async (m) => {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const detail = (await detailRes.json()) as Record<string, unknown>;
          const payload = detail.payload as
            | { headers?: unknown[] }
            | undefined;
          const headers = Array.isArray(payload?.headers)
            ? (payload?.headers as unknown[])
            : [];
          const subjectHeader = headers.find(
            (h): h is { name: string; value: string } =>
              typeof h === "object" &&
              h !== null &&
              (h as Record<string, unknown>).name === "Subject" &&
              typeof (h as Record<string, unknown>).value === "string"
          );
          const fromHeader = headers.find(
            (h): h is { name: string; value: string } =>
              typeof h === "object" &&
              h !== null &&
              (h as Record<string, unknown>).name === "From" &&
              typeof (h as Record<string, unknown>).value === "string"
          );
          return {
            id: m.id,
            source: "gmail",
            sender: fromHeader ? fromHeader.value : "",
            subject: subjectHeader ? subjectHeader.value : "",
            content: typeof detail.snippet === "string" ? detail.snippet : "",
          };
        })
    );

    res.status(200).json({
      messages,
      nextPageToken: typeof listData.nextPageToken === "string" ? listData.nextPageToken : undefined,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch Gmail messages" });
  }
}
