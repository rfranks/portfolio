"use client";

import { ChatMessage } from "@/types/talentforge/types";
import { JobListing } from "@/types/talentforge/job";

const STORAGE_API_URL = process.env.NEXT_PUBLIC_TALENTFORGE_STORAGE_API_URL;

const STORAGE_KEYS = {
  resume: "talentforge:resume",
  chatHistory: "talentforge:chatHistory",
  jobApplications: "talentforge:jobApplications",
} as const;

async function storeItem<T>(key: string, value: T): Promise<void> {
  if (STORAGE_API_URL) {
    await fetch(`${STORAGE_API_URL}/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

async function getItem<T>(key: string): Promise<T | null> {
  if (STORAGE_API_URL) {
    try {
      const response = await fetch(`${STORAGE_API_URL}/${key}`);
      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      return null;
    }
    return null;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    const data = window.localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as T;
    }
  }

  return null;
}

export async function saveParsedResume(resume: string): Promise<void> {
  await storeItem(STORAGE_KEYS.resume, resume);
}

export async function loadParsedResume(): Promise<string | null> {
  return await getItem<string>(STORAGE_KEYS.resume);
}

export async function saveChatHistory(
  history: ChatMessage[]
): Promise<void> {
  await storeItem(STORAGE_KEYS.chatHistory, history);
}

export async function loadChatHistory(): Promise<ChatMessage[] | null> {
  return await getItem<ChatMessage[]>(STORAGE_KEYS.chatHistory);
}

export async function saveJobApplications(
  applications: JobListing[]
): Promise<void> {
  await storeItem(STORAGE_KEYS.jobApplications, applications);
}

export async function loadJobApplications(): Promise<JobListing[] | null> {
  return await getItem<JobListing[]>(STORAGE_KEYS.jobApplications);
}

export async function clearStorage(): Promise<void> {
  if (STORAGE_API_URL) {
    await fetch(`${STORAGE_API_URL}/clear`, { method: "POST" });
    return;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  }
}
