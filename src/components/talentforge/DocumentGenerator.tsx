"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
  IconButton,
  Dialog,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ContentCopy, Download, PictureAsPdf } from "@mui/icons-material";
import { Document as PDFViewer, Page, pdfjs } from "react-pdf";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { marked } from "marked";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

import {
  generateCoverLetter,
  generateTailoredResume,
} from "@/utils/talentforge/documentGenerator";

/**
 * DocumentGenerator allows users to generate a tailored resume and cover letter
 * based on a job description. Generated documents can be copied to the
 * clipboard or downloaded as text files.
 */
export default function DocumentGenerator() {
  const [jobDescription, setJobDescription] = React.useState("");
  const [resume, setResume] = React.useState("");
  const [tailoredResume, setTailoredResume] = React.useState("");
  const [coverLetter, setCoverLetter] = React.useState("");
  const [loadingResume, setLoadingResume] = React.useState(false);
  const [loadingCover, setLoadingCover] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);
  const [previewFilename, setPreviewFilename] = React.useState("");

  const handleGenerateResume = async () => {
    setLoadingResume(true);
    const result = await generateTailoredResume({
      resume,
      jobDescription,
    });
    setTailoredResume(result);
    setLoadingResume(false);
  };

  const handleGenerateCoverLetter = async () => {
    setLoadingCover(true);
    const result = await generateCoverLetter({
      resume,
      jobDescription,
    });
    setCoverLetter(result);
    setLoadingCover(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadTxt = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatePdfBlob = async (markdown: string): Promise<Blob> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const text = marked.parse(markdown).replace(/<[^>]+>/g, "");
    const lines = text.split(/\n+/);
    let y = height - 50;
    lines.forEach((line) => {
      page.drawText(line, { x: 50, y, size: fontSize, font });
      y -= fontSize + 4;
    });
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  };

  const handlePreview = async (filename: string, markdown: string) => {
    const blob = await generatePdfBlob(markdown);
    setPdfBlob(blob);
    setPreviewFilename(filename);
    setPreviewOpen(true);
  };

  const handleDownloadPdf = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = previewFilename;
    link.click();
    URL.revokeObjectURL(url);
    setPreviewOpen(false);
    setPdfBlob(null);
  };

  const ready = jobDescription.trim() && resume.trim();

  return (
    <Box id="document-generator" sx={{ py: 6 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4" component="h2" align="center">
            Document Generator
          </Typography>
          <TextField
            label="Job Description"
            multiline
            minRows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <TextField
            label="Your Resume"
            multiline
            minRows={4}
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleGenerateResume}
              disabled={!ready || loadingResume}
            >
              {loadingResume ? "Generating…" : "Generate Resume"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleGenerateCoverLetter}
              disabled={!ready || loadingCover}
            >
              {loadingCover ? "Generating…" : "Generate Cover Letter"}
            </Button>
          </Stack>

          {tailoredResume && (
            <Stack spacing={1}>
              <Typography variant="h6">Tailored Resume</Typography>
              <TextField
                multiline
                minRows={6}
                value={tailoredResume}
                onChange={(e) => setTailoredResume(e.target.value)}
              />
              <Stack direction="row" spacing={1}>
                <IconButton
                  aria-label="copy tailored resume"
                  onClick={() => handleCopy(tailoredResume)}
                >
                  <ContentCopy />
                </IconButton>
                <IconButton
                  aria-label="download tailored resume"
                  onClick={() =>
                    handleDownloadTxt("tailored-resume.txt", tailoredResume)
                  }
                >
                  <Download />
                </IconButton>
                <IconButton
                  aria-label="preview tailored resume pdf"
                  onClick={() => handlePreview("tailored-resume.pdf", tailoredResume)}
                >
                  <PictureAsPdf />
                </IconButton>
              </Stack>
            </Stack>
          )}

          {coverLetter && (
            <Stack spacing={1}>
              <Typography variant="h6">Cover Letter</Typography>
              <TextField
                multiline
                minRows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
              <Stack direction="row" spacing={1}>
                <IconButton
                  aria-label="copy cover letter"
                  onClick={() => handleCopy(coverLetter)}
                >
                  <ContentCopy />
                </IconButton>
                <IconButton
                  aria-label="download cover letter"
                  onClick={() =>
                    handleDownloadTxt("cover-letter.txt", coverLetter)
                  }
                >
                  <Download />
                </IconButton>
                <IconButton
                  aria-label="preview cover letter pdf"
                  onClick={() => handlePreview("cover-letter.pdf", coverLetter)}
                >
                  <PictureAsPdf />
                </IconButton>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Container>
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          {pdfBlob && (
            <PDFViewer file={pdfBlob}>
              <Page pageNumber={1} />
            </PDFViewer>
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
