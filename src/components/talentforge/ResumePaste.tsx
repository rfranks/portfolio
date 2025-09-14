"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";

import useResumeParser from "@/hooks/useResumeParser";

interface ExtractedFields {
  name: string;
  email: string;
  phone: string;
}

function extractFields(resumeText: string): ExtractedFields {
  const email =
    resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = resumeText.match(/(\+?\d[\d\s-]{7,}\d)/)?.[0] || "";
  const lines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const name = lines[0] || "";
  return { name, email, phone };
}

export default function ResumePaste() {
  const { resume, parseResume } = useResumeParser();
  const [input, setInput] = useState("");
  const [fields, setFields] = useState<ExtractedFields | null>(null);

  const handleParse = async () => {
    const text = await parseResume(input);
    setFields(extractFields(text));
  };

  return (
    <Box>
      <TextField
        label="Paste your resume"
        multiline
        minRows={6}
        fullWidth
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <Button
        variant="contained"
        onClick={handleParse}
        sx={{ mt: 2 }}
      >
        Parse
      </Button>
      {resume && fields && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Typography>
              <strong>Name:</strong> {fields.name || "N/A"}
            </Typography>
            <Typography>
              <strong>Email:</strong> {fields.email || "N/A"}
            </Typography>
            <Typography>
              <strong>Phone:</strong> {fields.phone || "N/A"}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

