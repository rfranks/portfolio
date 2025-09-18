"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  TextField,
  Button,
} from "@mui/material";
import {
  useTalentForgeData,
  useTalentForgeSelector,
} from "@/contexts/TalentForgeDataContext";
import type { RecruiterEntry, Message } from "@/types";

function cloneRecruiter(recruiter: RecruiterEntry): RecruiterEntry {
  return {
    ...recruiter,
    tags: [...recruiter.tags],
    threadIds: [...recruiter.threadIds],
  };
}

function areStringArraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function mergeRecruiterDrafts(
  source: RecruiterEntry[],
  drafts: RecruiterEntry[],
): RecruiterEntry[] {
  if (drafts.length === 0) {
    return source.map(cloneRecruiter);
  }

  const draftMap = new Map(drafts.map((draft) => [draft.id, draft]));

  return source.map((recruiter) => {
    const existing = draftMap.get(recruiter.id);
    if (!existing) {
      return cloneRecruiter(recruiter);
    }

    const merged = cloneRecruiter(recruiter);

    if (!areStringArraysEqual(existing.tags, recruiter.tags)) {
      merged.tags = [...existing.tags];
    }

    if (existing.notes !== recruiter.notes) {
      merged.notes = existing.notes;
    }

    return merged;
  });
}

export default function RecruiterList() {
  const data = useTalentForgeData();
  const recruiterList = useTalentForgeSelector((store) => store.getRecruiters());
  const messages = useTalentForgeSelector((store) => store.getMessages());
  const [recruiterDrafts, setRecruiterDrafts] = useState<RecruiterEntry[]>([]);

  useEffect(() => {
    setRecruiterDrafts((drafts) => mergeRecruiterDrafts(recruiterList, drafts));
  }, [recruiterList]);

  const handleSave = (recruiter: RecruiterEntry) => {
    const updated = data.updateRecruiter(recruiter);
    setRecruiterDrafts((drafts) => mergeRecruiterDrafts(updated, drafts));
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Recruiters
      </Typography>
      {recruiterDrafts.map((r) => (
        <Box key={r.id} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {r.name}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {r.tags.map((tag) => (
              <Chip key={tag} label={tag} sx={{ mb: 1 }} />
            ))}
          </Stack>
          <TextField
            label="Tags"
            value={r.tags.join(", ")}
            onChange={(e) =>
              setRecruiterDrafts((rec) =>
                rec.map((rr) =>
                  rr.id === r.id
                    ? {
                        ...rr,
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      }
                    : rr,
                ),
              )
            }
            sx={{ mt: 1 }}
            fullWidth
          />
          <TextField
            label="Notes"
            multiline
            rows={3}
            value={r.notes}
            onChange={(e) =>
              setRecruiterDrafts((rec) =>
                rec.map((rr) =>
                  rr.id === r.id ? { ...rr, notes: e.target.value } : rr,
                ),
              )
            }
            sx={{ mt: 1 }}
            fullWidth
          />
          <Button
            variant="contained"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => handleSave(r)}
          >
            Save
          </Button>
          {r.threadIds.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Threads:
              </Typography>
              {r.threadIds.map((id) => {
                const msg = messages.find((m) => m.id === id);
                return (
                  <Typography key={id} variant="body2">
                    {msg ? msg.body : id}
                  </Typography>
                );
              })}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

