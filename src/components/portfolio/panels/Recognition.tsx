import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import type { ResumeData } from "@/consts/resumeData";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import SubsectionPager from "@/components/portfolio/layout/SubsectionPager";
import {
  EmojiGlyph,
  ImageLightbox,
  MarkdownContent,
  MediaCycler,
} from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";

type RecommendationEntry = ResumeData["recognition"]["recommendations"][number];
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
        alignItems: "stretch",
        justifyContent: "flex-start",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          minWidth: 0,
          minHeight: 0,
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
        <Box sx={{ minWidth: 0, minHeight: 0, flex: "1 1 auto", overflowY: "auto", pr: 0.25 }}>
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
        </Box>
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
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="flex-start"
        sx={{ minWidth: 0, flexShrink: 0 }}
      >
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
        ) : (
          <Avatar
            alt={rec.name}
            sx={{
              width: 48,
              height: 48,
              bgcolor: "background.paper",
              color: "text.secondary",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <AccountCircleOutlined fontSize="small" />
          </Avatar>
        )}
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
      <Box
        sx={{
          minHeight: 0,
          flex: "1 1 auto",
          overflowY: "auto",
          pr: 0.5,
          overflowX: "hidden",
        }}
      >
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
  const { recognition } = useResumeData();
  const snippets = recognition.snippets as RecognitionSnippetEntry[];
  const recommendations = recognition.recommendations;
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
          px: { xs: 0.75, md: 1 },
          py: 0.5,
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
          px: { xs: 0.75, md: 1 },
          py: 0.5,
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
  const recommendationPagerItems = React.useMemo(
    () =>
      recommendations.map((rec, index) => ({
        key: `recommendation-${rec.name}-${index}`,
        title: rec.name,
        optionTitle: rec.name,
        optionSubtitle: [rec.title?.trim(), rec.date?.trim()].filter(Boolean) as string[],
        optionImageSrc: rec.imageSrcUrl ? withBasePath(rec.imageSrcUrl) : undefined,
        optionImageAlt: rec.name,
        optionIcon: rec.imageSrcUrl ? undefined : <AccountCircleOutlined fontSize="small" />,
      })),
    [recommendations],
  );
  const activeSnippetIndex = React.useMemo(
    () => snippetItems.findIndex((item) => item.key === activeSnippetKey),
    [activeSnippetKey, snippetItems],
  );
  const activeRecommendationIndex = React.useMemo(
    () => recommendationItems.findIndex((item) => item.key === activeRecommendationKey),
    [activeRecommendationKey, recommendationItems],
  );
  const hasMultipleSnippetItems = snippetItems.length > 1;
  const hasMultipleRecommendationItems = recommendationItems.length > 1;

  const handlePreviousSnippet = React.useCallback(() => {
    if (!hasMultipleSnippetItems) {
      return;
    }
    if (activeSnippetIndex <= 0) {
      setActiveSnippetKey(snippetItems[snippetItems.length - 1]?.key);
      return;
    }
    setActiveSnippetKey(snippetItems[activeSnippetIndex - 1]?.key);
  }, [activeSnippetIndex, hasMultipleSnippetItems, snippetItems]);

  const handleNextSnippet = React.useCallback(() => {
    if (!hasMultipleSnippetItems) {
      return;
    }
    if (activeSnippetIndex >= snippetItems.length - 1) {
      setActiveSnippetKey(snippetItems[0]?.key);
      return;
    }
    setActiveSnippetKey(snippetItems[activeSnippetIndex + 1]?.key);
  }, [activeSnippetIndex, hasMultipleSnippetItems, snippetItems]);

  const handlePreviousRecommendation = React.useCallback(() => {
    if (!hasMultipleRecommendationItems) {
      return;
    }
    if (activeRecommendationIndex <= 0) {
      setActiveRecommendationKey(recommendationItems[recommendationItems.length - 1]?.key);
      return;
    }
    setActiveRecommendationKey(recommendationItems[activeRecommendationIndex - 1]?.key);
  }, [activeRecommendationIndex, hasMultipleRecommendationItems, recommendationItems]);

  const handleNextRecommendation = React.useCallback(() => {
    if (!hasMultipleRecommendationItems) {
      return;
    }
    if (activeRecommendationIndex >= recommendationItems.length - 1) {
      setActiveRecommendationKey(recommendationItems[0]?.key);
      return;
    }
    setActiveRecommendationKey(recommendationItems[activeRecommendationIndex + 1]?.key);
  }, [activeRecommendationIndex, hasMultipleRecommendationItems, recommendationItems]);

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
      <Typography
        variant="h6"
        sx={{
          position: "sticky",
          top: (theme) => `-${theme.spacing(2)}`,
          zIndex: 5,
          mx: -2,
          mt: -2,
          px: 3.5,
          py: 1,
          mb: 0,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(8px)",
          borderTopLeftRadius: "var(--fabric-radius-xl)",
          borderTopRightRadius: "var(--fabric-radius-xl)",
        }}
      >
        Recognition
      </Typography>
        <Box
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            display: "grid",
            gap: 2,
            pt: 1.25,
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
          <Box sx={{ minHeight: 0, flex: "1 1 auto", overflow: "hidden" }}>
            <MediaCycler
              items={snippetItems}
              singlePanel
              singlePanelActiveKey={activeSnippetKey}
              showChevronNavigation={false}
              stackSx={{
                minHeight: 0,
                height: "100%",
              }}
            />
          </Box>
          {hasMultipleSnippetItems ? (
            <Box
              sx={{
                flexShrink: 0,
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <IconButton size="small" aria-label="Previous recognition" onClick={handlePreviousSnippet}>
                  <ChevronLeft fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Next recognition" onClick={handleNextSnippet}>
                  <ChevronRight fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          ) : null}
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
              showChevronNavigation={false}
              stackSx={{
                minHeight: 0,
                height: "100%",
              }}
            />
          </Box>
          {hasMultipleRecommendationItems ? (
            <SubsectionPager
              menuId="recognition-recommendation-selector-menu"
              items={recommendationPagerItems}
              currentKey={activeRecommendationKey}
              previousAriaLabel="Previous recommendation"
              nextAriaLabel="Next recommendation"
              selectorAriaLabel="Open recommendation selector"
              onSelect={setActiveRecommendationKey}
              onPrevious={handlePreviousRecommendation}
              onNext={handleNextRecommendation}
            />
          ) : null}
        </Box>
      </Box>
    </PortfolioPanel>
  );
}
