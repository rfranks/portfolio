import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as resumeData from "@/consts/resumeData";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import {
  EmojiGlyph,
  ImageLightbox,
  MarkdownContent,
  MediaCycler,
} from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { withBasePath } from "@/utils/basePath";

type RecommendationEntry = (typeof resumeData.recognition.recommendations)[number];
type RecognitionSnippetEntry = {
  text: string;
  glyph?: string;
} | string;

function normalizeSnippet(snippet: RecognitionSnippetEntry): {
  text: string;
  glyph?: string;
} {
  if (typeof snippet === "string") {
    return { text: snippet };
  }

  return {
    text: snippet.text,
    glyph: snippet.glyph,
  };
}

function renderSnippetContent(snippet: RecognitionSnippetEntry) {
  const normalizedSnippet = normalizeSnippet(snippet);

  return (
    <Box
      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
      sx={{
        width: "100%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          minWidth: 0,
          width: "100%",
          height: "100%",
          alignItems: "stretch",
        }}
      >
        {normalizedSnippet.glyph ? (
          <Box
            sx={{
              minHeight: 0,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              pr: 0.25,
            }}
          >
            <EmojiGlyph
              glyph={normalizedSnippet.glyph}
              size="clamp(3.5rem, 9vw, 5.75rem)"
              sx={{ lineHeight: 0.9 }}
            />
          </Box>
        ) : null}
        <MarkdownContent
          content={normalizedSnippet.text}
          className="leading-7 italic"
          sx={{
            alignSelf: "flex-start",
            "& .MuiTypography-root": {
              fontSize: { xs: "1.08rem", md: "1.22rem" },
              lineHeight: { xs: 1.65, md: 1.72 },
            },
          }}
        />
      </Stack>
    </Box>
  );
}

function renderRecommendationContent(rec: RecommendationEntry) {
  return (
    <Box
      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
      sx={{
        width: "100%",
        minHeight: 0,
        height: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
        {rec.imageSrcUrl ? (
          <ImageLightbox
            src={withBasePath(rec.imageSrcUrl)}
            alt={rec.name}
            title={rec.name}
            caption={`${rec.title} · ${rec.date}`}
            triggerSx={{ borderRadius: "50%", lineHeight: 0, flexShrink: 0 }}
          >
            <Avatar
              alt={rec.name}
              src={withBasePath(rec.imageSrcUrl)}
              sx={{ width: 48, height: 48 }}
            />
          </ImageLightbox>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
            {rec.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rec.title} · {rec.date}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rec.relationship}
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflowY: "auto", pr: 0.5 }}>
        <MarkdownContent
          content={rec.text}
          variant="body1"
          className="leading-7 italic"
          sx={{
            minWidth: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        />
      </Box>
    </Box>
  );
}

export default function Recognition() {
  const snippets = resumeData.recognition.snippets as RecognitionSnippetEntry[];
  const recommendations = resumeData.recognition.recommendations;
  const [activeSnippetKey, setActiveSnippetKey] = React.useState<string | undefined>(
    snippets[0] ? "snippet-1" : undefined,
  );
  const [activeRecommendationKey, setActiveRecommendationKey] = React.useState<
    string | undefined
  >(recommendations[0] ? `recommendation-${recommendations[0].name}-0` : undefined);

  React.useEffect(() => {
    setActiveSnippetKey(snippets[0] ? "snippet-1" : undefined);
  }, [snippets]);

  React.useEffect(() => {
    setActiveRecommendationKey(
      recommendations[0] ? `recommendation-${recommendations[0].name}-0` : undefined,
    );
  }, [recommendations]);

  const snippetItems = React.useMemo<MediaCyclerItem[]>(
    () =>
      snippets.map((snippet, index) => ({
        key: `snippet-${index + 1}`,
        title: "",
        mediaType: "recognition",
        mediaUrl: "",
        onSelect: () => setActiveSnippetKey(`snippet-${index + 1}`),
        customContent: renderSnippetContent(snippet),
        panelSx: {
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
        },
        assetFrameSx: {
          minHeight: 0,
          height: "100%",
          px: { xs: 7, md: 8 },
          py: 1,
        },
        customContentSx: {
          minHeight: 0,
          height: "100%",
        },
      })),
    [snippets],
  );

  const recommendationItems = React.useMemo<MediaCyclerItem[]>(
    () =>
      recommendations.map((rec, index) => ({
        key: `recommendation-${rec.name}-${index}`,
        title: "",
        description: undefined,
        mediaType: "recommendation",
        mediaUrl: rec.imageSrcUrl ? withBasePath(rec.imageSrcUrl) : "",
        onSelect: () => setActiveRecommendationKey(`recommendation-${rec.name}-${index}`),
        customContent: renderRecommendationContent(rec),
        panelSx: {
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
        },
        assetFrameSx: {
          minHeight: 0,
          height: "100%",
          px: { xs: 7, md: 8 },
          py: 1,
        },
        customContentSx: {
          minHeight: 0,
          height: "100%",
          maxHeight: "100%",
          overflow: "hidden",
        },
      })),
    [recommendations],
  );

  return (
    <PortfolioPanel
      sx={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
        <Box
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            display: "grid",
            gap: 2,
            gridTemplateRows: {
              xs: "minmax(120px, 150px) minmax(0, 1fr)",
              md: "minmax(130px, 165px) minmax(0, 1fr)",
            },
          }}
        >
        <Box
          sx={{
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Typography variant="h6" gutterBottom className="mb-3">
            Recognition
          </Typography>
          <Box sx={{ minHeight: 0, flex: "1 1 auto", overflow: "hidden" }}>
            <MediaCycler
              items={snippetItems}
              singlePanel
              singlePanelActiveKey={activeSnippetKey}
              showChevronNavigation={snippetItems.length > 1}
              loopNavigation={snippetItems.length > 1}
              loopNavigationIcon="leftChevron"
              loopFromBeginning
              loopNavigationLabel="Loop recognition highlights"
              navigationControlSx={{
                top: 12,
                transform: "none",
              }}
              stackSx={{
                minHeight: 0,
                height: "100%",
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Typography variant="h6" gutterBottom className="mb-3">
            Recommendations
          </Typography>
          <Box sx={{ minHeight: 0, flex: "1 1 auto", overflow: "hidden" }}>
            <MediaCycler
              items={recommendationItems}
              singlePanel
              singlePanelActiveKey={activeRecommendationKey}
              showChevronNavigation={recommendationItems.length > 1}
              loopNavigation={recommendationItems.length > 1}
              loopNavigationIcon="leftChevron"
              loopFromBeginning
              loopNavigationLabel="Loop recommendations"
              navigationControlSx={{
                top: 12,
                transform: "none",
              }}
              stackSx={{
                minHeight: 0,
                height: "100%",
              }}
            />
          </Box>
        </Box>
      </Box>
    </PortfolioPanel>
  );
}
