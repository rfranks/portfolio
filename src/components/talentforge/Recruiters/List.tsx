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
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import type { RecruiterEntry, Message } from "@/types";

export default function RecruiterList() {
  const data = useTalentForgeData();
  const [recruiters, setRecruiters] = useState<RecruiterEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setRecruiters(data.getRecruiters());
    setMessages(data.getMessages());
  }, [data]);

  const handleSave = (recruiter: RecruiterEntry) => {
    const updated = data.updateRecruiter(recruiter);
    setRecruiters(updated);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Recruiters
      </Typography>
      {recruiters.map((r) => (
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
              setRecruiters((rec) =>
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
              setRecruiters((rec) =>
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

