import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import GridView from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import WebOutlined from "@mui/icons-material/WebOutlined";
import DnsOutlined from "@mui/icons-material/DnsOutlined";
import CloudQueueOutlined from "@mui/icons-material/CloudQueueOutlined";
import HubOutlined from "@mui/icons-material/HubOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useResumeData } from "@/providers/ResumeDataProvider";
import SubsectionPager from "@/components/portfolio/layout/SubsectionPager";
import Chip from "@/components/fabric/Chip";
import MediaCycler from "@/components/shared/media/MediaCycler";
import {
  EmojiListAvatar,
  GridCloudNavigationSlide,
  PortfolioPanelShell,
} from "@/components/shared";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";

const spokeLineGrow = keyframes`
  0% { opacity: 0; transform: translateY(-50%) rotate(var(--spoke-angle, 0deg)) scaleX(0); }
  100% { opacity: 1; transform: translateY(-50%) rotate(var(--spoke-angle, 0deg)) scaleX(1); }
`;

const returnNodeReveal = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.82); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

export type CompetencyItem = {
  label: string;
  description: string;
  emoji?: string;
  sourceLink?: string;
};

export type CompetencyCategory = {
  title: string;
  items: CompetencyItem[];
  icon?: string;
  emoji?: string;
  shortText?: string;
  subTitle?: string;
};
type CompetencySkill = CompetencyCategory["items"][number];
type NodeTransitionSnapshot = {
  label: string;
  fontSizeRem: number;
  x: number;
  y: number;
};
type ReturningNodeState = {
  snapshot: NodeTransitionSnapshot;
  phase: "revealing" | "returning";
};
type OpeningNodeState = {
  snapshot: NodeTransitionSnapshot;
  toCenter: boolean;
};

const OPEN_SPOKES_MS = 225;
const CLOSE_SPOKES_MS = 420;
const OPEN_NODE_TRAVEL_MS = 320;
const SKILL_NODE_TRAVEL_MS = 640;
const SKILL_NODE_SCALE_MS = 620;
const RETURN_NODE_REVEAL_MS = 220;
const RETURN_NODE_TRAVEL_MS = 420;
const COMPETENCY_OPEN_SOUND_PATH = "/audio/maximize_009.mp3";
const COMPETENCY_CLOSE_SOUND_PATH = "/audio/whoosh.mp3";
const SKILL_EXPAND_SOUND_PATHS = [
  "/audio/maximize_008.mp3",
  "/audio/maximize_009.mp3",
  "/audio/phaserUp3.mp3",
  "/audio/highUp.ogg",
  "/audio/powerUp11.mp3",
] as const;
const SKILL_CLOSE_SOUND_PATH = "/audio/whoosh.mp3";
const NODE_CURSOR = "url('/assets/cursors/PNG/Basic/Default/pointer_scifi_a.png') 4 2, pointer";
const SKILL_REFERENCE_LINKS: Record<string, string> = {
  "Retrieval-augmented generation": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
  "Large Language Models (LLM)": "https://en.wikipedia.org/wiki/Large_language_model",
  LangChain: "https://www.langchain.com/",
  "Clinical NLP with ICD-10/SNOMED/LOINC/RxNorm":
    "https://www.nlm.nih.gov/research/umls/index.html",
  Deepgram: "https://deepgram.com/",
  AssemblyAI: "https://www.assemblyai.com/",
  "AWS Transcribe": "https://aws.amazon.com/transcribe/",
  "AWS Comprehend Medical": "https://aws.amazon.com/comprehend/medical/",
  ElevenLabs: "https://elevenlabs.io/",
  React: "https://react.dev/",
  "Next.js": "https://nextjs.org/docs",
  TypeScript: "https://www.typescriptlang.org/docs/",
  "React Native": "https://reactnative.dev/docs/getting-started",
  Expo: "https://docs.expo.dev/",
  "Design systems": "https://m3.material.io/",
  "Monorepos (single-spa)": "https://single-spa.js.org/",
  Turborepo: "https://turbo.build/repo/docs",
  "Python (Django, Flask, FastAPI)": "https://docs.python.org/3/",
  "Java (Spring Boot/Hibernate)": "https://spring.io/projects/spring-boot",
  "TypeScript APIs": "https://www.typescriptlang.org/docs/",
  NestJS: "https://docs.nestjs.com/",
  "Azure Functions": "https://learn.microsoft.com/azure/azure-functions/",
  AWS: "https://docs.aws.amazon.com/",
  "Amazon S3": "https://docs.aws.amazon.com/s3/",
  CosmosDB: "https://learn.microsoft.com/azure/cosmos-db/",
  "Google Cloud Storage": "https://cloud.google.com/storage/docs",
  "GitHub Actions CI/CD": "https://docs.github.com/actions",
  "Model deployment": "https://ml-ops.org/",
  "Containerized deployments": "https://docs.docker.com/",
  "REST APIs": "https://restfulapi.net/",
  "Event-driven microservices": "https://martinfowler.com/articles/201701-event-driven.html",
  PostgreSQL: "https://www.postgresql.org/docs/",
  MongoDB: "https://www.mongodb.com/docs/",
  MySQL: "https://dev.mysql.com/doc/",
  "Architecture board member": "https://martinfowler.com/architecture/",
  "Engineering mentor": "https://www.atlassian.com/blog/developer/mentoring-software-engineers",
  "Cross-functional collaboration with product, UX, QA, and DevOps":
    "https://www.thoughtworks.com/insights/blog/cross-functional-teams",
};
const getSkillReferenceUrl = (skillLabel: string) =>
  SKILL_REFERENCE_LINKS[skillLabel] ??
  `https://www.google.com/search?q=${encodeURIComponent(`${skillLabel} documentation`)}`;

const normalizeCompetencyOptionIconKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const resolveCompetencyEmoji = (
  categoryTitle: string,
  competencyLabel: string,
  configuredEmoji?: string,
) => {
  const explicit = configuredEmoji?.trim();
  if (explicit) {
    return explicit;
  }

  const normalizedCategory = categoryTitle.trim().toLowerCase();
  if (normalizedCategory.includes("ai")) {
    return "🤖";
  }
  if (normalizedCategory.includes("frontend")) {
    return "🖥️";
  }
  if (normalizedCategory.includes("backend")) {
    return "🧰";
  }
  if (normalizedCategory.includes("cloud")) {
    return "☁️";
  }
  if (normalizedCategory.includes("data")) {
    return "🗂️";
  }
  if (normalizedCategory.includes("leadership")) {
    return "🤝";
  }

  const normalizedLabel = competencyLabel.trim().toLowerCase();
  if (normalizedLabel.includes("react") || normalizedLabel.includes("typescript")) {
    return "⚛️";
  }
  if (normalizedLabel.includes("python") || normalizedLabel.includes("java")) {
    return "💻";
  }
  if (normalizedLabel.includes("api")) {
    return "🔌";
  }

  return "✨";
};

const renderCompetencyOptionIcon = (iconKey?: string) => {
  const normalized = iconKey ? normalizeCompetencyOptionIconKey(iconKey) : "";
  switch (normalized) {
    case "autoawesome":
    case "sparkles":
    case "magic":
      return <AutoAwesomeOutlined fontSize="small" />;
    case "web":
    case "frontend":
    case "ui":
      return <WebOutlined fontSize="small" />;
    case "backend":
    case "server":
    case "dns":
    case "api":
      return <DnsOutlined fontSize="small" />;
    case "cloud":
    case "devops":
    case "infrastructure":
      return <CloudQueueOutlined fontSize="small" />;
    case "data":
    case "integration":
    case "hub":
      return <HubOutlined fontSize="small" />;
    case "leadership":
    case "people":
    case "team":
    case "groups":
      return <GroupsOutlined fontSize="small" />;
    default:
      return <CategoryOutlined fontSize="small" />;
  }
};

const renderCompetencyCategoryVisual = (category: CompetencyCategory) => {
  const emoji = typeof category.emoji === "string" ? category.emoji.trim() : "";
  if (emoji) {
    return (
      <Box
        component="span"
        aria-hidden
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.35rem",
          lineHeight: 1,
        }}
      >
        {emoji}
      </Box>
    );
  }

  return renderCompetencyOptionIcon(typeof category.icon === "string" ? category.icon : undefined);
};

type CoreCompetenciesProps = {
  topRail?: React.ReactNode;
  categoriesOverride?: CompetencyCategory[];
  embedded?: boolean;
  menuIdPrefix?: string;
};

export default function CoreCompetencies({
  topRail,
  categoriesOverride,
  embedded = false,
  menuIdPrefix = "competency",
}: CoreCompetenciesProps) {
  const { competencies } = useResumeData();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const sourceCategories = categoriesOverride ?? competencies.categories;
  const categories = React.useMemo(
    () =>
      [...sourceCategories].sort((left, right) =>
        left.title.localeCompare(right.title, undefined, {
          sensitivity: "base",
        }),
      ),
    [sourceCategories],
  );
  const [selectedOrbIndex, setSelectedOrbIndex] = React.useState<number | null>(null);
  const [viewMode, setViewMode] = React.useState<"cloud" | "list">("list");
  const [isClosingSpokes, setIsClosingSpokes] = React.useState(false);
  const [spokesVisible, setSpokesVisible] = React.useState(false);
  const [skillNodesAtOrbit, setSkillNodesAtOrbit] = React.useState(false);
  const [activeBulletCategoryKey, setActiveBulletCategoryKey] = React.useState<string>(
    categories[0] ? "competency-category-0" : "",
  );
  const [expandedSkillKey, setExpandedSkillKey] = React.useState<string | null>(null);
  const [openingNode, setOpeningNode] = React.useState<OpeningNodeState | null>(null);
  const [returningNode, setReturningNode] = React.useState<ReturningNodeState | null>(null);
  const openTimeoutRef = React.useRef<number | null>(null);
  const closeTimeoutRef = React.useRef<number | null>(null);
  const returnRevealTimeoutRef = React.useRef<number | null>(null);
  const returnTravelTimeoutRef = React.useRef<number | null>(null);
  const openNodeRafRef = React.useRef<number | null>(null);
  const skillOrbitRafRef = React.useRef<number | null>(null);
  const panelContainerRef = React.useRef<HTMLDivElement | null>(null);
  const panelTileRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const [panelViewportSize, setPanelViewportSize] = React.useState({
    width: 0,
    height: 0,
  });
  const competencyOpenSfx = useAudio(COMPETENCY_OPEN_SOUND_PATH);
  const competencyCloseSfx = useAudio(COMPETENCY_CLOSE_SOUND_PATH);
  const skillExpandSfxA = useAudio(SKILL_EXPAND_SOUND_PATHS[0]);
  const skillExpandSfxB = useAudio(SKILL_EXPAND_SOUND_PATHS[1]);
  const skillExpandSfxC = useAudio(SKILL_EXPAND_SOUND_PATHS[2]);
  const skillExpandSfxD = useAudio(SKILL_EXPAND_SOUND_PATHS[3]);
  const skillExpandSfxE = useAudio(SKILL_EXPAND_SOUND_PATHS[4]);
  const skillCloseSfx = useAudio(SKILL_CLOSE_SOUND_PATH);
  const skillExpandSfxRefs = [
    skillExpandSfxA,
    skillExpandSfxB,
    skillExpandSfxC,
    skillExpandSfxD,
    skillExpandSfxE,
  ] as const;

  const selectedCategory = selectedOrbIndex == null ? null : categories[selectedOrbIndex] || null;
  const isCloudView = viewMode === "cloud";
  const spokeNodeOffset = "clamp(26px, 3.2vw, 42px)";

  const panelLayout = React.useMemo(() => {
    const clampNumber = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));
    const skillCounts = categories.map((category) => Math.max(1, category.items.length));
    const logCounts = skillCounts.map((count) => Math.log(count + 1));
    const minLogCount = Math.min(...logCounts);
    const maxLogCount = Math.max(...logCounts);
    const logRange = Math.max(0.0001, maxLogCount - minLogCount);

    return categories.map((category, index) => {
      const skillCount = category.items.length;
      const skillWeight = (Math.log(Math.max(1, skillCount) + 1) - minLogCount) / logRange;
      const colSpanLg = clampNumber(2 + Math.round(skillWeight * 1), 2, 3);
      const colSpanMd = clampNumber(2 + Math.round(skillWeight * 1), 2, 3);
      const colSpanSm = 2;
      const colSpanXs = skillWeight > 0.72 ? 2 : 1;
      const nodeHeight = Math.round(38 + skillWeight * 16);
      const rowSpan = clampNumber(Math.ceil((nodeHeight + 8) / 18), 3, 4);
      const titleFontSizeRem = Number((0.68 + skillWeight * 0.12).toFixed(2));

      return {
        category,
        index,
        colSpanXs,
        colSpanSm,
        colSpanMd,
        colSpanLg,
        rowSpan,
        nodeHeight,
        titleFontSizeRem,
      };
    });
  }, [categories]);

  const bulletCategoryItems = React.useMemo(
    () =>
      categories.map((category, index) => {
        const key = `competency-category-${index}`;
        return {
          key,
          title: "",
          description: "",
          mediaType: "custom" as const,
          mediaUrl: "",
          onSelect: () => {
            setActiveBulletCategoryKey(key);
          },
          panelSx: {
            width: "100%",
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
          assetFrameSx: {
            minHeight: 0,
            height: "100%",
            px: 0,
            py: 0.5,
          },
          customContentSx: {
            minHeight: 0,
            height: "100%",
          },
          customContent: (
            <Stack
              spacing={0.9}
              sx={{
                minHeight: 0,
                height: "100%",
                overflowY: "auto",
                overscrollBehavior: "contain",
                pr: 0.5,
              }}
            >
              {category.items.map((competency, competencyIndex) =>
                (() => {
                  const maybeSourceLink = (competency as { sourceLink?: unknown }).sourceLink;
                  const maybeEmoji = (competency as { emoji?: unknown }).emoji;
                  const resolvedEmoji =
                    typeof maybeEmoji === "string" && maybeEmoji.trim()
                      ? maybeEmoji.trim()
                      : resolveCompetencyEmoji(category.title, competency.label);
                  const resolvedSourceLink =
                    typeof maybeSourceLink === "string" && maybeSourceLink.trim()
                      ? maybeSourceLink.trim()
                      : getSkillReferenceUrl(competency.label);

                  return (
                    <Box
                      key={`${category.title}-${competency.label}-subtitle`}
                      data-grid-cloud-stagger-leaf="true"
                      sx={{
                        "--grid-cloud-leaf-index": competencyIndex,
                        px: 0.8,
                        py: 0.55,
                        borderRadius: "10px",
                      }}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="stretch">
                        <Box
                          sx={{
                            minWidth: 46,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                          }}
                        >
                          <EmojiListAvatar
                            emoji={resolvedEmoji}
                            size={40}
                            fontSize="2rem"
                            borderAlpha={0.26}
                            backgroundAlpha={0.1}
                          />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            component={Link}
                            href={resolvedSourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            variant="subtitle2"
                            sx={{ fontWeight: 700, lineHeight: 1.25 }}
                          >
                            {competency.label}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.3 }}
                          >
                            {competency.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })(),
              )}
            </Stack>
          ),
        };
      }),
    [categories],
  );

  React.useEffect(() => {
    if (bulletCategoryItems.length === 0) {
      if (activeBulletCategoryKey) {
        setActiveBulletCategoryKey("");
      }
      return;
    }

    const hasKey = bulletCategoryItems.some((item) => item.key === activeBulletCategoryKey);
    if (!hasKey) {
      setActiveBulletCategoryKey(bulletCategoryItems[0]?.key ?? "");
    }
  }, [activeBulletCategoryKey, bulletCategoryItems]);

  const hasMultipleBulletCategoryItems = bulletCategoryItems.length > 1;
  const bulletCategoryPickerItems = React.useMemo(
    () =>
      categories.map((category, index) => {
        const optionSubtitle =
          (typeof category.shortText === "string" && category.shortText.trim()) ||
          (typeof category.subTitle === "string" && category.subTitle.trim()) ||
          "";
        return {
          key: `competency-category-${index}`,
          title: category.title,
          optionTitle: category.title,
          optionSubtitle: optionSubtitle || undefined,
          selectedIcon: renderCompetencyCategoryVisual(category),
          optionIcon: renderCompetencyCategoryVisual(category),
        };
      }),
    [categories],
  );
  const activeBulletCategoryIndex = React.useMemo(
    () => bulletCategoryItems.findIndex((item) => item.key === activeBulletCategoryKey),
    [activeBulletCategoryKey, bulletCategoryItems],
  );

  const handlePreviousBulletCategory = React.useCallback(() => {
    if (!hasMultipleBulletCategoryItems || bulletCategoryItems.length === 0) {
      return;
    }

    const previousIndex =
      activeBulletCategoryIndex <= 0
        ? bulletCategoryItems.length - 1
        : activeBulletCategoryIndex - 1;
    bulletCategoryItems[previousIndex]?.onSelect?.();
  }, [activeBulletCategoryIndex, bulletCategoryItems, hasMultipleBulletCategoryItems]);

  const handleNextBulletCategory = React.useCallback(() => {
    if (!hasMultipleBulletCategoryItems || bulletCategoryItems.length === 0) {
      return;
    }

    const nextIndex =
      activeBulletCategoryIndex >= bulletCategoryItems.length - 1
        ? 0
        : activeBulletCategoryIndex + 1;
    bulletCategoryItems[nextIndex]?.onSelect?.();
  }, [activeBulletCategoryIndex, bulletCategoryItems, hasMultipleBulletCategoryItems]);

  const spokeLayout = React.useMemo(() => {
    if (!selectedCategory) {
      return [] as Array<{
        skill: CompetencySkill;
        angle: number;
        radiusPx: number;
        index: number;
      }>;
    }

    const skills = selectedCategory.items;
    const ringCount = skills.length > 10 ? 3 : skills.length > 6 ? 2 : 1;
    const rings: CompetencySkill[][] = Array.from({ length: ringCount }, () => []);
    skills.forEach((skill, index) => {
      rings[index % ringCount].push(skill);
    });

    const width = panelViewportSize.width || 980;
    const height = panelViewportSize.height || 460;
    const minSide = Math.min(width, height);
    const ringRadii = [
      Math.max(96, minSide * 0.24),
      Math.max(148, minSide * 0.36),
      Math.max(196, minSide * 0.48),
    ];
    // Boundary guard for skill nodes while still allowing longer spokes.
    const skillNodeHalfWidth = 130;
    const skillNodeHalfHeight = 50;
    const edgePadding = 14;
    const maxRadiusX = Math.max(0, width / 2 - skillNodeHalfWidth - edgePadding);
    const maxRadiusY = Math.max(0, height / 2 - skillNodeHalfHeight - edgePadding);

    const nodes: Array<{
      skill: CompetencySkill;
      angle: number;
      radiusPx: number;
      index: number;
    }> = [];

    rings.forEach((ring, ringIndex) => {
      const count = ring.length;
      if (count === 0) {
        return;
      }

      const angleOffset = -90 + (ringIndex * 360) / (count * 2);
      ring.forEach((skill, skillIndex) => {
        const angle = angleOffset + (skillIndex / count) * 360;
        const radians = (angle * Math.PI) / 180;
        const absCos = Math.max(0.08, Math.abs(Math.cos(radians)));
        const absSin = Math.max(0.08, Math.abs(Math.sin(radians)));
        const fitRadius = Math.min(maxRadiusX / absCos, maxRadiusY / absSin);
        const baseRadius = ringRadii[ringIndex] ?? ringRadii[ringRadii.length - 1] ?? 96;
        const radiusPx = Math.max(0, Math.min(baseRadius, fitRadius - 8));

        nodes.push({
          skill,
          angle,
          radiusPx,
          index: nodes.length,
        });
      });
    });

    return nodes;
  }, [panelViewportSize.height, panelViewportSize.width, selectedCategory]);

  const clearTimers = React.useCallback(() => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (returnRevealTimeoutRef.current) {
      window.clearTimeout(returnRevealTimeoutRef.current);
      returnRevealTimeoutRef.current = null;
    }
    if (returnTravelTimeoutRef.current) {
      window.clearTimeout(returnTravelTimeoutRef.current);
      returnTravelTimeoutRef.current = null;
    }
    if (openNodeRafRef.current) {
      window.cancelAnimationFrame(openNodeRafRef.current);
      openNodeRafRef.current = null;
    }
    if (skillOrbitRafRef.current) {
      window.cancelAnimationFrame(skillOrbitRafRef.current);
      skillOrbitRafRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  React.useEffect(() => {
    if (!isCloudView) {
      return;
    }

    const containerNode = panelContainerRef.current;
    if (!containerNode) {
      return;
    }

    const updateSize = () => {
      setPanelViewportSize({
        width: containerNode.clientWidth,
        height: containerNode.clientHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(containerNode);

    return () => {
      observer.disconnect();
    };
  }, [isCloudView]);

  const getNodeTransitionSnapshot = React.useCallback(
    (orbIndex: number): NodeTransitionSnapshot | null => {
      const containerNode = panelContainerRef.current;
      const tileNode = panelTileRefs.current[orbIndex];
      if (!containerNode || !tileNode) {
        return null;
      }

      const panel = panelLayout.find((candidate) => candidate.index === orbIndex);
      if (!panel) {
        return null;
      }

      const containerRect = containerNode.getBoundingClientRect();
      const tileRect = tileNode.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;
      const tileCenterX = tileRect.left + tileRect.width / 2;
      const tileCenterY = tileRect.top + tileRect.height / 2;

      return {
        label: panel.category.title,
        fontSizeRem: panel.titleFontSizeRem,
        x: tileCenterX - containerCenterX,
        y: tileCenterY - containerCenterY,
      };
    },
    [panelLayout],
  );

  const handleSelectOrb = React.useCallback(
    (orbIndex: number) => {
      if (isClosingSpokes || returningNode || openingNode) {
        return;
      }

      clearTimers();
      setReturningNode(null);
      setSelectedOrbIndex(orbIndex);
      setIsClosingSpokes(false);
      setSpokesVisible(false);
      setSkillNodesAtOrbit(false);
      setExpandedSkillKey(null);
      rewindAndPlayAudio(competencyOpenSfx, {
        volume: 0.28,
      });

      const transitionSnapshot = getNodeTransitionSnapshot(orbIndex);
      if (transitionSnapshot) {
        setOpeningNode({
          snapshot: transitionSnapshot,
          toCenter: false,
        });
        openNodeRafRef.current = window.requestAnimationFrame(() => {
          setOpeningNode((current) => (current ? { ...current, toCenter: true } : current));
          openNodeRafRef.current = null;
        });

        openTimeoutRef.current = window.setTimeout(() => {
          setOpeningNode(null);
          setSpokesVisible(true);
          skillOrbitRafRef.current = window.requestAnimationFrame(() => {
            setSkillNodesAtOrbit(true);
            skillOrbitRafRef.current = null;
          });
          openTimeoutRef.current = null;
        }, OPEN_NODE_TRAVEL_MS);
        return;
      }

      openTimeoutRef.current = window.setTimeout(() => {
        setSpokesVisible(true);
        skillOrbitRafRef.current = window.requestAnimationFrame(() => {
          setSkillNodesAtOrbit(true);
          skillOrbitRafRef.current = null;
        });
        openTimeoutRef.current = null;
      }, OPEN_SPOKES_MS);
    },
    [
      clearTimers,
      competencyOpenSfx,
      getNodeTransitionSnapshot,
      isClosingSpokes,
      openingNode,
      returningNode,
    ],
  );

  const handleCloseSpokes = React.useCallback(() => {
    if (selectedOrbIndex == null || isClosingSpokes || returningNode || openingNode) {
      return;
    }

    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    setIsClosingSpokes(true);
    setSpokesVisible(true);
    setSkillNodesAtOrbit(false);
    setExpandedSkillKey(null);
    rewindAndPlayAudio(competencyCloseSfx, {
      volume: 0.24,
    });

    const orbIndexAtClose = selectedOrbIndex;
    closeTimeoutRef.current = window.setTimeout(() => {
      setSpokesVisible(false);
      setIsClosingSpokes(false);
      closeTimeoutRef.current = null;
      const transitionSnapshot = getNodeTransitionSnapshot(orbIndexAtClose);
      if (!transitionSnapshot) {
        setSelectedOrbIndex(null);
        return;
      }

      setReturningNode({
        snapshot: transitionSnapshot,
        phase: "revealing",
      });
      returnRevealTimeoutRef.current = window.setTimeout(() => {
        setReturningNode((current) => (current ? { ...current, phase: "returning" } : current));
        returnRevealTimeoutRef.current = null;

        returnTravelTimeoutRef.current = window.setTimeout(() => {
          setReturningNode(null);
          setSelectedOrbIndex(null);
          returnTravelTimeoutRef.current = null;
        }, RETURN_NODE_TRAVEL_MS);
      }, RETURN_NODE_REVEAL_MS);
    }, CLOSE_SPOKES_MS);
  }, [
    competencyCloseSfx,
    getNodeTransitionSnapshot,
    isClosingSpokes,
    openingNode,
    returningNode,
    selectedOrbIndex,
  ]);

  const handleViewModeChange = React.useCallback(
    (nextCloudView: boolean) => {
      if (!nextCloudView) {
        clearTimers();
        setViewMode("list");
        setOpeningNode(null);
        setReturningNode(null);
        setSelectedOrbIndex(null);
        setIsClosingSpokes(false);
        setSpokesVisible(false);
        setSkillNodesAtOrbit(false);
        setExpandedSkillKey(null);
        return;
      }

      setViewMode("cloud");
    },
    [clearTimers],
  );
  const cloudContent = (
    <Box
      ref={panelContainerRef}
      sx={{
        position: "relative",
        minHeight: 0,
        flex: "1 1 auto",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          p: { xs: 1, sm: 1.5, md: 2 },
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(6, minmax(0, 1fr))",
            md: "repeat(8, minmax(0, 1fr))",
            lg: "repeat(10, minmax(0, 1fr))",
          },
          gridAutoRows: "18px",
          gridAutoFlow: "dense",
          gap: { xs: 0.6, sm: 0.85, md: 1 },
          overflowY: "auto",
          pr: 0.5,
          opacity: selectedCategory ? 0 : 1,
          pointerEvents: selectedCategory ? "none" : "auto",
          transition: "none",
        }}
      >
        {panelLayout.map((panel) => (
          <Box
            key={panel.category.title}
            ref={(node: HTMLDivElement | null) => {
              panelTileRefs.current[panel.index] = node;
            }}
            sx={{
              gridColumn: {
                xs: `span ${panel.colSpanXs}`,
                sm: `span ${panel.colSpanSm}`,
                md: `span ${panel.colSpanMd}`,
                lg: `span ${panel.colSpanLg}`,
              },
              gridRow: `span ${panel.rowSpan}`,
              minHeight: 0,
            }}
          >
            <Chip
              label={panel.category.title}
              onClick={() => {
                if (selectedOrbIndex == null) {
                  handleSelectOrb(panel.index);
                }
              }}
              clickable
              color="primary"
              variant="outlined"
              sx={{
                width: "100%",
                height: "100%",
                minHeight: "100%",
                cursor: NODE_CURSOR,
                borderRadius: "12px",
                borderWidth: 1.2,
                backdropFilter: "blur(1px)",
                boxShadow: "0 4px 12px rgba(2,6,23,0.2)",
                "& .MuiChip-label": {
                  width: "100%",
                  px: 0.8,
                  py: 0.55,
                  fontSize: `${panel.titleFontSizeRem}rem`,
                  fontWeight: 700,
                  whiteSpace: "normal",
                  lineHeight: 1.15,
                  textAlign: "center",
                },
              }}
            />
          </Box>
        ))}
      </Box>

      {selectedCategory ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            bgcolor: theme.palette.mode === "dark" ? "rgba(2,6,23,0.18)" : "rgba(255,255,255,0.34)",
            backdropFilter: "blur(2px)",
            pointerEvents: "none",
          }}
        >
          {spokesVisible && expandedSkillKey == null
            ? spokeLayout.map((node) => (
                <Box
                  key={`line-${node.skill.label}`}
                  sx={{
                    "--spoke-angle": `${node.angle}deg`,
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: `calc(${node.radiusPx}px + ${spokeNodeOffset})`,
                    height: "1px",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.26)
                        : alpha(theme.palette.grey[700], 0.3),
                    transform: "translateY(-50%) rotate(var(--spoke-angle))",
                    transformOrigin: "0 50%",
                    zIndex: 4,
                    animation: `${spokeLineGrow} ${
                      isClosingSpokes ? CLOSE_SPOKES_MS : OPEN_SPOKES_MS
                    }ms cubic-bezier(.22,.82,.28,.98) both`,
                    animationDelay: `${node.index * (isClosingSpokes ? 12 : 18)}ms`,
                    animationDirection: isClosingSpokes ? "reverse" : "normal",
                  }}
                />
              ))
            : null}

          {spokesVisible
            ? spokeLayout.map((node) =>
                (() => {
                  const skillKey = `${node.skill.label}-${node.index}`;
                  const maybeSourceLink = (node.skill as { sourceLink?: unknown }).sourceLink;
                  const referenceUrl =
                    typeof maybeSourceLink === "string" && maybeSourceLink.trim()
                      ? maybeSourceLink.trim()
                      : getSkillReferenceUrl(node.skill.label);
                  const nodeSkillEmoji = resolveCompetencyEmoji(
                    selectedCategory.title,
                    node.skill.label,
                    typeof (node.skill as { emoji?: unknown }).emoji === "string"
                      ? (node.skill as { emoji?: string }).emoji
                      : undefined,
                  );
                  const isExpanded = expandedSkillKey === skillKey;
                  const hasExpandedSkill = expandedSkillKey !== null;
                  const shouldMuteNode = hasExpandedSkill && !isExpanded;
                  const centerAlongSpokeTransform = `translate(-50%, -50%) rotate(${node.angle}deg) translateX(0px) rotate(${-node.angle}deg)`;
                  const orbitTransform = `translate(-50%, -50%) rotate(${node.angle}deg) translateX(calc(${node.radiusPx}px + ${spokeNodeOffset})) rotate(${-node.angle}deg)`;
                  const nodeTransform = isExpanded
                    ? "translate(-50%, -50%) scale(1.04)"
                    : skillNodesAtOrbit
                      ? orbitTransform
                      : centerAlongSpokeTransform;
                  const handleExpand = () => {
                    setExpandedSkillKey(skillKey);
                    const nextSfx = skillExpandSfxRefs[node.index % skillExpandSfxRefs.length];
                    rewindAndPlayAudio(nextSfx, {
                      volume: 0.24,
                    });
                  };
                  const handleCollapse = () => {
                    setExpandedSkillKey(null);
                    rewindAndPlayAudio(skillCloseSfx, {
                      volume: 0.22,
                    });
                  };

                  return (
                    <Box
                      key={`skill-${node.skill.label}`}
                      sx={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: nodeTransform,
                        transition: isExpanded
                          ? "transform 420ms cubic-bezier(.22,.82,.28,.98), opacity 240ms ease"
                          : `transform ${SKILL_NODE_TRAVEL_MS}ms cubic-bezier(.22,1.08,.24,1), opacity 220ms ease`,
                        transitionDelay:
                          isExpanded || !skillNodesAtOrbit ? "0ms" : `${node.index * 22}ms`,
                        zIndex: isExpanded ? 8 : 5,
                        opacity: shouldMuteNode ? 0 : 1,
                        pointerEvents: isClosingSpokes || shouldMuteNode ? "none" : "auto",
                      }}
                    >
                      <Box
                        sx={{
                          transform: isExpanded || skillNodesAtOrbit ? "scale(1)" : "scale(0.42)",
                          transition: isExpanded
                            ? "transform 300ms cubic-bezier(.22,.82,.28,.98)"
                            : `transform ${SKILL_NODE_SCALE_MS}ms cubic-bezier(.16,1,.3,1)`,
                          transitionDelay:
                            isExpanded || !skillNodesAtOrbit ? "0ms" : `${node.index * 22}ms`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: isExpanded ? 0.55 : 0,
                          }}
                        >
                          {isExpanded ? (
                            <Box
                              sx={{
                                width: "fit-content",
                                minWidth: { xs: 170, md: 220 },
                                maxWidth: { xs: "min(84vw, 320px)", md: 360 },
                                height: "fit-content",
                                px: 1.2,
                                py: 0.9,
                                borderRadius: "14px",
                                bgcolor:
                                  theme.palette.mode === "dark"
                                    ? alpha(theme.palette.success.main, 0.3)
                                    : alpha(theme.palette.success.light, 0.52),
                                border: "1px solid",
                                borderColor:
                                  theme.palette.mode === "dark"
                                    ? alpha(theme.palette.success.light, 0.48)
                                    : alpha(theme.palette.success.dark, 0.35),
                                boxShadow: "0 10px 20px rgba(2,6,23,0.2)",
                                transition: "box-shadow 260ms ease, background-color 260ms ease",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 1,
                                  mb: 0.6,
                                }}
                              >
                                <Box
                                  sx={{
                                    minWidth: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.8,
                                  }}
                                >
                                  <EmojiListAvatar
                                    emoji={nodeSkillEmoji}
                                    size={26}
                                    borderAlpha={0.34}
                                    backgroundAlpha={0.14}
                                  />
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      fontWeight: 700,
                                      lineHeight: 1.2,
                                      color:
                                        theme.palette.mode === "dark"
                                          ? alpha(theme.palette.common.white, 0.94)
                                          : alpha(theme.palette.success.dark, 0.92),
                                    }}
                                  >
                                    {node.skill.label}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  aria-label={`Close ${node.skill.label}`}
                                  onClick={handleCollapse}
                                  sx={{
                                    cursor: NODE_CURSOR,
                                    color:
                                      theme.palette.mode === "dark"
                                        ? alpha(theme.palette.common.white, 0.94)
                                        : alpha(theme.palette.success.dark, 0.92),
                                    border: "1px solid",
                                    borderColor:
                                      theme.palette.mode === "dark"
                                        ? alpha(theme.palette.common.white, 0.44)
                                        : alpha(theme.palette.success.dark, 0.42),
                                    bgcolor:
                                      theme.palette.mode === "dark"
                                        ? alpha(theme.palette.success.dark, 0.26)
                                        : alpha(theme.palette.common.white, 0.64),
                                    "&:hover": {
                                      bgcolor:
                                        theme.palette.mode === "dark"
                                          ? alpha(theme.palette.success.dark, 0.42)
                                          : alpha(theme.palette.common.white, 0.86),
                                    },
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.8 }}>
                                <EmojiListAvatar
                                  emoji={nodeSkillEmoji}
                                  size={24}
                                  borderAlpha={0.26}
                                  backgroundAlpha={0.1}
                                />
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    textAlign: "left",
                                    lineHeight: 1.28,
                                    color:
                                      theme.palette.mode === "dark"
                                        ? alpha(theme.palette.common.white, 0.9)
                                        : alpha(theme.palette.success.dark, 0.9),
                                  }}
                                >
                                  {node.skill.description}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  mt: 0.6,
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <Link
                                  href={referenceUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  underline="always"
                                  sx={{
                                    cursor: NODE_CURSOR,
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.02em",
                                    color:
                                      theme.palette.mode === "dark"
                                        ? alpha(theme.palette.common.white, 0.94)
                                        : alpha(theme.palette.success.dark, 0.92),
                                  }}
                                >
                                  More...
                                </Link>
                              </Box>
                            </Box>
                          ) : (
                            <Chip
                              label={
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.65,
                                  }}
                                >
                                  <EmojiListAvatar emoji={nodeSkillEmoji} size={22} />
                                  <Box component="span">{node.skill.label}</Box>
                                </Box>
                              }
                              variant="outlined"
                              color="primary"
                              clickable
                              onClick={handleExpand}
                              sx={{
                                width: "fit-content",
                                maxWidth: { xs: "min(72vw, 280px)", md: 260 },
                                height: "auto",
                                cursor: NODE_CURSOR,
                                borderWidth: 1.2,
                                boxShadow: "none",
                                bgcolor:
                                  theme.palette.mode === "dark"
                                    ? alpha(theme.palette.background.paper, 0.45)
                                    : alpha(theme.palette.background.paper, 0.86),
                                transition: "box-shadow 260ms ease, background-color 260ms ease",
                                "& .MuiChip-label": {
                                  px: 1.3,
                                  py: 0.7,
                                  whiteSpace: "normal",
                                  lineHeight: 1.2,
                                  textAlign: "center",
                                },
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })(),
              )
            : null}
        </Box>
      ) : null}

      {selectedCategory &&
      spokesVisible &&
      !isClosingSpokes &&
      !openingNode &&
      !returningNode &&
      expandedSkillKey == null ? (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9,
            pointerEvents: "auto",
          }}
        >
          <IconButton
            aria-label="Collapse skills"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleCloseSpokes();
            }}
            sx={{
              cursor: NODE_CURSOR,
              border: "1px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.54)
                  : alpha(theme.palette.common.black, 0.36),
              color:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.94)
                  : alpha(theme.palette.common.black, 0.82),
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.black, 0.34)
                  : alpha(theme.palette.common.white, 0.96),
              boxShadow: "0 8px 18px rgba(2,6,23,0.28)",
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.common.black, 0.5)
                    : alpha(theme.palette.common.white, 1),
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : null}

      {openingNode ? (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            zIndex: 10,
            pointerEvents: "none",
            transform: openingNode.toCenter
              ? "translate(-50%, -50%)"
              : `translate(calc(-50% + ${openingNode.snapshot.x}px), calc(-50% + ${openingNode.snapshot.y}px))`,
            transition: `transform ${OPEN_NODE_TRAVEL_MS}ms cubic-bezier(.16,.84,.26,1)`,
          }}
        >
          <Chip
            label={openingNode.snapshot.label}
            color="primary"
            variant="outlined"
            sx={{
              cursor: NODE_CURSOR,
              borderWidth: 1.2,
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(2,6,23,0.2)",
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.45)
                  : alpha(theme.palette.background.paper, 0.88),
              "& .MuiChip-label": {
                px: 0.9,
                py: 0.55,
                fontSize: `${openingNode.snapshot.fontSizeRem}rem`,
                fontWeight: 700,
                whiteSpace: "normal",
                lineHeight: 1.15,
                textAlign: "center",
              },
            }}
          />
        </Box>
      ) : null}

      {returningNode ? (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            zIndex: 10,
            pointerEvents: "none",
            opacity: 1,
            transform:
              returningNode.phase === "returning"
                ? `translate(calc(-50% + ${returningNode.snapshot.x}px), calc(-50% + ${returningNode.snapshot.y}px))`
                : "translate(-50%, -50%)",
            transition:
              returningNode.phase === "returning"
                ? `transform ${RETURN_NODE_TRAVEL_MS}ms cubic-bezier(.16,.84,.26,1)`
                : "none",
            animation:
              returningNode.phase === "revealing"
                ? `${returnNodeReveal} ${RETURN_NODE_REVEAL_MS}ms cubic-bezier(.22,.82,.28,.98) both`
                : "none",
          }}
        >
          <Chip
            label={returningNode.snapshot.label}
            color="primary"
            variant="outlined"
            sx={{
              cursor: NODE_CURSOR,
              borderWidth: 1.2,
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(2,6,23,0.2)",
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.45)
                  : alpha(theme.palette.background.paper, 0.88),
              "& .MuiChip-label": {
                px: 0.9,
                py: 0.55,
                fontSize: `${returningNode.snapshot.fontSizeRem}rem`,
                fontWeight: 700,
                whiteSpace: "normal",
                lineHeight: 1.15,
                textAlign: "center",
              },
            }}
          />
        </Box>
      ) : null}
    </Box>
  );

  const listContent = (
    <Box
      sx={{
        minHeight: 0,
        flex: "1 1 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {hasMultipleBulletCategoryItems ? (
        <SubsectionPager
          menuId={`${menuIdPrefix}-category-selector-menu`}
          items={bulletCategoryPickerItems}
          currentKey={activeBulletCategoryKey}
          showOrdinal={false}
          selectedValueAsTitle
          selectedVisualSize={38}
          selectedIconFontSize="1.35rem"
          selectedIconFrameStyle="none"
          borderlessIconButtons
          previousAriaLabel="Previous competency category"
          nextAriaLabel="Next competency category"
          selectorAriaLabel="Open competency category selector"
          onSelect={setActiveBulletCategoryKey}
          onPrevious={handlePreviousBulletCategory}
          onNext={handleNextBulletCategory}
        />
      ) : null}
      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflow: "hidden" }}>
        <MediaCycler
          items={bulletCategoryItems}
          singlePanel
          singlePanelActiveKey={activeBulletCategoryKey}
          showChevronNavigation={false}
          stackSx={{
            minHeight: 0,
            height: "100%",
          }}
        />
      </Box>
    </Box>
  );

  const viewToggleFooter = (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        View
      </Typography>
      <IconButton
        size="small"
        aria-label="Show list view"
        onClick={() => handleViewModeChange(false)}
        sx={{ p: 0.35 }}
      >
        <FormatListBulleted fontSize="small" color={isCloudView ? "disabled" : "primary"} />
      </IconButton>
      <Switch
        checked={isCloudView}
        onChange={(event) => handleViewModeChange(event.target.checked)}
        inputProps={{ "aria-label": "Toggle competency view mode" }}
        color="primary"
        size="small"
      />
      <IconButton
        size="small"
        aria-label="Show panel view"
        onClick={() => handleViewModeChange(true)}
        sx={{ p: 0.35 }}
      >
        <GridView fontSize="small" color={isCloudView ? "primary" : "disabled"} />
      </IconButton>
    </Stack>
  );

  if (embedded) {
    return (
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
          <GridCloudNavigationSlide
            isMdUp={isMdUp}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            listContent={listContent}
            cloudContent={cloudContent}
            staggerRevealKey={activeBulletCategoryKey}
            showViewToggle={false}
            listViewAriaLabel="Show list view"
            cloudViewAriaLabel="Show panel view"
          />
        </Box>
        <Box
          sx={{
            py: 1.25,
            minHeight: "fit-content",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {viewToggleFooter}
        </Box>
      </Box>
    );
  }

  return (
    <PortfolioPanelShell
      panelClassName="h-full overflow-hidden"
      panelSx={{ overflow: "hidden" }}
      topRail={topRail}
      contentSx={{ pt: 0.5 }}
      useNegativeTopRailMargins
      useNegativeFooterMargins
      footerSx={{
        py: 1.25,
        minHeight: "fit-content",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      footer={viewToggleFooter}
    >
      <GridCloudNavigationSlide
        isMdUp={isMdUp}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        listContent={listContent}
        cloudContent={cloudContent}
        staggerRevealKey={activeBulletCategoryKey}
        showViewToggle={false}
        footerSx={{
          py: 1.25,
          minHeight: "fit-content",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        listViewAriaLabel="Show list view"
        cloudViewAriaLabel="Show panel view"
      />
    </PortfolioPanelShell>
  );
}
