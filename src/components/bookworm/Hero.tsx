"use client";

import * as React from "react";
import Markdown from "react-markdown";

import {
  Box,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Link,
  OutlinedInput,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { DeleteForeverOutlined, PublishOutlined } from "@mui/icons-material";

import {
  aiBufferSize,
  summarizePDFPrompt,
  userQuestionPrompt,
} from "@/consts/bookworm/consts";
import { ChatMessage } from "@/types/bookworm/types";
import { askOpenAI, pdfToMarkdown } from "@/utils/bookworm/utils";

import CircularProgressWithLabel from "./CircularProgressWithLabel";
import FileUploader from "./FileUploader";
import TermsDialog from "./TermsDialog";

export default function Hero() {
  const [chatHistory, setChatHistoryState] = React.useState<
    (ChatMessage | null)[]
  >([]);
  const [pdfAsMarkdown, setPdfAsMarkdown] = React.useState<string>("");
  const [pdfSummary, setPdfSummary] = React.useState<string>("");
  const [userQuestion, setUserQuestion] = React.useState<string>("");
  const [activeQuestionIndex, setActiveQuestionIndex] = React.useState<
    number | null
  >(0);
  const [pdfProgress, setPdfProgress] = React.useState<number | null>(null);
  const [openTerms, setOpenTerms] = React.useState<boolean>(false);
  const setChatHistory = (newChatHistory: typeof chatHistory) => {
    setChatHistoryState(newChatHistory);
    setActiveQuestionIndex(null);
  };

  const chatParentRef = React.useRef<HTMLDivElement>(null);
  const userQuestionInputRef = React.useRef<HTMLInputElement>(null);

  const askUserQuestion = async () => {
    const context =
      pdfAsMarkdown?.length > aiBufferSize ? pdfSummary : pdfAsMarkdown;

    askOpenAI({
      context,
      user: `${userQuestion}`,
      system: userQuestionPrompt,
      returnFirstResponse: true,
      chatHistory,
      onChatHistoryChange: setChatHistory,
    });

    setUserQuestion("");
  };

  const setActiveQuestionIndexByOffset = (
    offset: number,
    activeQuestionIndexFromParam?: number
  ) => {
    if (
      activeQuestionIndexFromParam === null ||
      activeQuestionIndexFromParam === undefined
    ) {
      activeQuestionIndexFromParam =
        activeQuestionIndex === null
          ? chatHistory.length - 1 + offset
          : activeQuestionIndex + offset;
    }

    setActiveQuestionIndex(activeQuestionIndexFromParam);

    if (
      activeQuestionIndexFromParam !== null &&
      activeQuestionIndexFromParam < chatHistory.length - 1
    ) {
      const nextActiveQuestionIndex = Math.max(activeQuestionIndexFromParam, 2);
      const activeQuestion = chatHistory[nextActiveQuestionIndex];

      if (activeQuestion === null || activeQuestion?.role === "user") {
        setUserQuestion(activeQuestion?.message || "");
        userQuestionInputRef?.current?.focus();
      } else {
        setActiveQuestionIndex(nextActiveQuestionIndex);
        setActiveQuestionIndexByOffset(
          offset,
          nextActiveQuestionIndex + offset
        );
      }
    } else {
      setUserQuestion("");
      setActiveQuestionIndex(null);
    }
  };

  React.useEffect(() => {
    chatParentRef?.current &&
      (chatParentRef.current.scrollTop =
        chatParentRef?.current?.scrollHeight || 0);
  });

  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: "100%",
        backgroundImage:
          theme.palette.mode === "light"
            ? "linear-gradient(180deg, #CEE5FD, #FFF)"
            : `linear-gradient(#02294F, ${alpha("#090E10", 0.0)})`,
        backgroundSize: "100% 20%",
        backgroundRepeat: "no-repeat",
      })}
    >
      <TermsDialog open={openTerms} onClose={() => setOpenTerms(false)} />
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: { xs: 10 },
          pb: { xs: 2 },
        }}
      >
        <Stack spacing={2} useFlexGap sx={{ width: { xs: "100%", sm: "70%" } }}>
          <Typography
            variant="h1"
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignSelf: "center",
              textAlign: "center",
              fontSize: "clamp(3.5rem, 10vw, 4rem)",
            }}
          >
            Welcome to&nbsp;
            <Typography
              variant="h1"
              component={"span"}
              color="text.primary"
              sx={{
                ml: 1,
                fontFamily: '"Gloria Hallelujah", cursive',
                fontWeight: 400,
                fontStyle: "normal",
              }}
            >
              bookworm
            </Typography>
          </Typography>
          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{ alignSelf: "center", width: { sm: "100%", md: "80%" } }}
          >
            Introducing your AI-powered reading assistant designed to
            revolutionize the way you interact with PDFs.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignSelf="center"
            spacing={1}
            useFlexGap
            sx={{ pt: 2, width: { xs: "100%" } }}
          >
            <FileUploader
              accept=".pdf"
              label="Upload your pdf"
              outputType="files"
              sx={{ width: { xs: "100%" } }}
              onChange={async (filesFromParam) => {
                const files = filesFromParam as File[];
                if (files && files.length > 0) {
                  const markdown = await pdfToMarkdown(files[0]);

                  setPdfAsMarkdown(markdown);

                    const context = markdown;

                  const summary = await askOpenAI({
                    context,
                    user: "Summarize the markdown content.",
                    system: summarizePDFPrompt,
                    logMessagesToChatHistory: false,
                    chatHistory,
                    onChatHistoryChange: setChatHistory,
                    onPDFProgressChange: setPdfProgress,
                  });

                  setPdfSummary(summary?.message || "");

                  userQuestionInputRef?.current &&
                    userQuestionInputRef.current.focus();
                }
              }}
            />
          </Stack>
          <Typography
            variant="caption"
            textAlign="center"
            sx={{ opacity: 0.8 }}
          >
            By using this site, you agree to our&nbsp;
            <Link
              onClick={() => setOpenTerms(true)}
              color="primary"
              sx={{ cursor: "pointer" }}
            >
              Terms & Conditions
            </Link>
            .
          </Typography>
        </Stack>
        <Box
          ref={chatParentRef}
          sx={(theme) => ({
            mt: { xs: 2 },
            alignSelf: "center",
            height: { xs: 200, sm: 400 },
            overflowY: "auto",
            width: "100%",
            backgroundImage:
              theme.palette.mode === "light"
                ? 'url("/static/images/templates/templates-images/hero-light.png")'
                : 'url("/static/images/templates/templates-images/hero-dark.png")',
            backgroundSize: "cover",
            borderRadius: "10px",
            outline: "1px solid",
            outlineColor:
              theme.palette.mode === "light"
                ? alpha("#BFCCD9", 0.5)
                : alpha("#9CCCFC", 0.1),
            boxShadow:
              theme.palette.mode === "light"
                ? `0 0 12px 8px ${alpha("#9CCCFC", 0.2)}`
                : `0 0 24px 12px ${alpha("#033363", 0.2)}`,
            p: 2,
          })}
        >
          {chatHistory.map((chat, index) => {
            if (!chat?.message) {
              return null;
            }

            return (
              <Box
                key={index}
                sx={{
                  borderRadius: "10px",
                  p: 1,
                  my: 1,
                  backgroundColor:
                    chat?.role === "user"
                      ? alpha("#BFCCD9", 0.5)
                      : alpha("#9CCCFC", 0.5),
                }}
              >
                {chat?.role === "assistant" ? (
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ fontWeight: 600 }}
                  >
                    <Typography
                      variant="h6"
                      component={"span"}
                      color="text.primary"
                      sx={{
                        ml: 1,
                        fontFamily: '"Gloria Hallelujah", cursive',
                        fontWeight: 400,
                        fontStyle: "normal",
                      }}
                    >
                      bookworm
                    </Typography>
                    &nbsp;says...
                  </Typography>
                ) : (
                  chat?.message && (
                    <Typography
                      variant="h6"
                      color="text.primary"
                      sx={{ fontWeight: 600 }}
                    >
                      You...
                    </Typography>
                  )
                )}
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    whiteSpace: "pre-wrap",
                    color:
                      chat?.role === "user" ? "text.primary" : "text.secondary",
                  }}
                >
                  <Markdown>{chat?.message}</Markdown>
                  {chat?.message === "I'm thinking..." && chat?.hasMore ? (
                    <CircularProgress size={12} />
                  ) : (
                    ""
                  )}
                  {chat?.message === "Processing PDF..." &&
                    chat?.hasMore &&
                    (pdfProgress !== null ? (
                      <CircularProgressWithLabel
                        value={pdfProgress}
                        size={18}
                      />
                    ) : (
                      <CircularProgress size={18} />
                    ))}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <OutlinedInput
          ref={userQuestionInputRef}
          placeholder="Ask bookworm anything about your PDF..."
          fullWidth
          value={userQuestion}
          onChange={(event) => setUserQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();

              askUserQuestion();
            } else if (event.key === "ArrowUp") {
              setActiveQuestionIndexByOffset(-1);
            } else if (event.key === "ArrowDown") {
              setActiveQuestionIndexByOffset(1);
            } else {
              setActiveQuestionIndex(null);
            }
          }}
          multiline
          sx={{ mt: { xs: 2 } }}
          endAdornment={
            <InputAdornment position="end">
              <Stack
                direction="row"
                alignSelf="center"
                spacing={1}
                useFlexGap
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <IconButton
                  aria-label="submit user question"
                  disabled={!userQuestion || !pdfAsMarkdown}
                  onClick={askUserQuestion}
                  edge="end"
                >
                  <PublishOutlined />
                </IconButton>
                <IconButton
                  aria-label="clear chat history"
                  disabled={!chatHistory?.length}
                  onClick={() => setChatHistory([])}
                  edge="end"
                >
                  <DeleteForeverOutlined />
                </IconButton>
              </Stack>
            </InputAdornment>
          }
        />
      </Container>
    </Box>
  );
}
