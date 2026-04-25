import type { MediaCyclerItem } from "@/types/media/mediaCycler";
import type { ProjectData } from "@/types/components/portfolio";
import { withBasePath } from "@/utils/basePath";
import type { ResolvedProjectTerminalDemo } from "../sections/DemoSection";

export const resolveTerminalDemo = (project: ProjectData): ResolvedProjectTerminalDemo | null => {
  const configured = project.terminalDemo;
  const configuredMediaUrl = configured?.mediaUrl?.trim();
  const fallbackVideoUrl = project.demoVideoUrl?.trim();
  const fallbackImageUrl = project.demoGifUrl?.trim();
  const fallbackMediaType: "video" | "image" | null = fallbackVideoUrl
    ? "video"
    : fallbackImageUrl
      ? "image"
      : null;
  const mediaType = configured?.mediaType ?? fallbackMediaType;

  if (!mediaType) {
    return null;
  }

  const mediaUrl =
    configuredMediaUrl ||
    (mediaType === "video" ? fallbackVideoUrl : fallbackImageUrl) ||
    fallbackVideoUrl ||
    fallbackImageUrl;

  if (!mediaUrl) {
    return null;
  }

  return {
    title: configured?.title?.trim() || `${project.project} Demo`,
    subtitle: configured?.subtitle?.trim(),
    caption: configured?.caption?.trim() || project.demoCaption?.trim() || "",
    mediaType,
    mediaUrl,
    mediaAlt: configured?.mediaAlt?.trim() || `${project.project} demo`,
  };
};

export const resolveDemoItems = (project: ProjectData): MediaCyclerItem[] => {
  const items: MediaCyclerItem[] = [];

  if (project.demoGifUrl) {
    items.push({
      key: "demo-image",
      title: "",
      mediaType: "image",
      mediaUrl: withBasePath(project.demoGifUrl),
      mediaAlt: `${project.project} demo`,
      mediaLightboxTitle: `${project.project} demo`,
      panelSx: {
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      },
      assetFrameSx: {
        width: "100%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      imageWidth: 800,
      imageHeight: 450,
      imageStyle: {
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        borderRadius: 0,
      },
    });
  }

  if (project.demoVideoUrl) {
    items.push({
      key: "demo-video",
      title: "",
      mediaType: "video",
      mediaUrl: withBasePath(project.demoVideoUrl),
      mediaLightboxTitle: `${project.project} demo video`,
      controls: true,
      playsInline: true,
      panelSx: {
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      },
      assetFrameSx: {
        width: "100%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      previewVideoSx: {
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
        objectFit: "contain",
        borderRadius: 0,
      },
    });
  }

  return items;
};
