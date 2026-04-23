"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import KeyboardCommandKey from "@mui/icons-material/KeyboardCommandKey";
import HelpOutline from "@mui/icons-material/HelpOutline";
import Search from "@mui/icons-material/Search";
import { usePathname, useSearchParams } from "next/navigation";
import { projects } from "@/consts/resumeData";
import {
  getPortfolioStaticSearchIndexActions,
  getPresentationProjectContractBySlug,
  getPresentationSectionTitle,
} from "@/components/portfolio/projectPageData";
import { ToggleColorMode } from "@/components/shared";
import type { AppBarProps, CommandPaletteAction } from "@/types/components/portfolio";
import { withBasePath } from "@/utils/basePath";
import {
  PORTFOLIO_NAVIGATION_TELEMETRY_ACTION,
  PORTFOLIO_PAGER_TELEMETRY_ACTION,
  PORTFOLIO_SHORTCUT_EVENT,
} from "@/consts/observability/telemetryEvents";
import {
  emitPortfolioShortcutEvent,
  emitPortfolioTelemetryEvent,
} from "@/utils/observability/telemetryEvents";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";

interface StyledAppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth?: number;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerWidth",
})<StyledAppBarProps>(({ theme, open, drawerWidth = 240 }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor:
    theme.palette.mode === "light"
      ? alpha(theme.palette.background.paper, 0.84)
      : "var(--fabric-surface-2)",
  backgroundImage:
    theme.palette.mode === "light"
      ? `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.88)}, ${alpha(theme.palette.primary.light, 0.08)} 44%, transparent 100%)`
      : "linear-gradient(180deg, var(--fabric-inner-glow), transparent 44%)",
  color: theme.palette.text.primary,
  border: "1px solid",
  borderColor:
    theme.palette.mode === "light"
      ? alpha(theme.palette.primary.main, 0.14)
      : "var(--fabric-surface-border)",
  borderRadius: 0,
  boxShadow:
    theme.palette.mode === "light"
      ? "0 10px 28px rgba(35, 58, 99, 0.1)"
      : "var(--fabric-shadow-tight)",
  backdropFilter: "blur(var(--fabric-blur-md))",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

function normalizeActionSearchText(action: CommandPaletteAction) {
  return [action.label, action.subtitle ?? "", action.group ?? "", ...(action.keywords ?? [])]
    .join(" ")
    .toLowerCase();
}

function dedupeActions(actions: CommandPaletteAction[]) {
  const seen = new Set<string>();
  const deduped: CommandPaletteAction[] = [];
  for (const action of actions) {
    const dedupeKey = `${action.id}::${action.label}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    deduped.push(action);
  }
  return deduped;
}

export default function AppBar({
  open,
  drawerWidth,
  mode = "dark",
  toggleColorMode,
  commandPaletteActions = [],
  commandPaletteTitle = "Command Palette",
  commandPalettePlaceholder = "Type a command...",
  children,
  ...other
}: AppBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const commandInputRef = useRef<HTMLInputElement | null>(null);

  const presentationProjectSlugs = useMemo(
    () =>
      new Set(
        projects
          .filter(
            (project) =>
              typeof project.type === "string" &&
              project.type.toLowerCase() === "presentation" &&
              typeof project.href === "string" &&
              project.href.trim().startsWith("/"),
          )
          .map((project) => project.href.trim().replace(/^\/+/, "")),
      ),
    [],
  );

  const inferredProjectParam = useMemo(() => {
    const normalizedPath = (pathname ?? "").trim();
    if (!normalizedPath) {
      return undefined;
    }
    const candidate = normalizedPath.split("/").filter(Boolean).at(-1);
    if (!candidate) {
      return undefined;
    }
    return presentationProjectSlugs.has(candidate) ? candidate : undefined;
  }, [pathname, presentationProjectSlugs]);

  const projectParam = searchParams?.get("project")?.trim() || inferredProjectParam;
  const staticSearchIndexActions = useMemo(() => getPortfolioStaticSearchIndexActions(), []);
  const routeAwareActions = useMemo<CommandPaletteAction[]>(() => {
    if (!projectParam) {
      return [];
    }

    const projectContract = getPresentationProjectContractBySlug(projectParam);
    if (!projectContract) {
      return [];
    }

    const projectAwareActions: CommandPaletteAction[] = projectContract.sections.map((slideKey) => {
      const slideLabel = getPresentationSectionTitle(slideKey);
      return {
        id: `switch-slide-${slideKey}`,
        label: `Switch Slide: ${slideLabel}`,
        subtitle: "Jump directly to this section",
        group: "Presentation",
        keywords: ["slide", "section", slideKey, slideLabel, "presentation", projectParam],
        onSelect: () => {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set("project", projectParam);
          nextUrl.searchParams.set("slide", slideKey);
          if (slideKey !== "diagrams") {
            nextUrl.searchParams.delete("diagram");
          }
          window.location.assign(nextUrl.toString());
        },
      };
    });

    projectAwareActions.push({
      id: "jump-to-diagrams",
      label: "Jump to Diagrams",
      subtitle: "Open architecture diagrams and select the first diagram",
      group: "Presentation",
      keywords: ["jump", "diagram", "architecture", "mermaid"],
      onSelect: () => {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("project", projectParam);
        nextUrl.searchParams.set("slide", "diagrams");
        nextUrl.searchParams.set("diagram", "1");
        window.location.assign(nextUrl.toString());
      },
    });

    projectAwareActions.push({
      id: "toggle-diagram-code-mode",
      label: "Toggle Diagram Code Mode",
      subtitle: "Show/hide Mermaid source for the visible diagram",
      group: "Presentation",
      keywords: ["diagram", "code", "source", "mermaid", "toggle"],
      onSelect: () => {
        const toggleButtons = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            "button[aria-label='Show Source'],button[aria-label='Show Diagram']",
          ),
        );
        const visibleToggleButton = toggleButtons.find(
          (button) => !button.disabled && button.offsetParent !== null,
        );
        if (visibleToggleButton) {
          visibleToggleButton.click();
          return;
        }

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("project", projectParam);
        nextUrl.searchParams.set("slide", "diagrams");
        window.location.assign(nextUrl.toString());
      },
    });

    return projectAwareActions;
  }, [projectParam]);

  const homeAction = useMemo<CommandPaletteAction>(
    () => ({
      id: "open-home",
      label: "Open Home",
      subtitle: "Return to portfolio homepage",
      group: "Navigation",
      href: "/",
      keywords: ["home", "portfolio", "dashboard", "root"],
    }),
    [],
  );

  const allActions = useMemo(
    () =>
      dedupeActions([
        homeAction,
        ...staticSearchIndexActions,
        ...commandPaletteActions,
        ...routeAwareActions,
      ]),
    [commandPaletteActions, homeAction, routeAwareActions, staticSearchIndexActions],
  );

  const filteredActions = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return allActions;
    }

    return allActions.filter((action) =>
      normalizeActionSearchText(action).includes(normalizedQuery),
    );
  }, [allActions, commandQuery]);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
    setCommandQuery("");
    setActiveCommandIndex(0);
  }, []);

  const openCommandPalette = useCallback((trigger: PortfolioTelemetryTrigger = "pointer") => {
    emitPortfolioTelemetryEvent({
      channel: "navigation",
      action: PORTFOLIO_NAVIGATION_TELEMETRY_ACTION.COMMAND_PALETTE_OPEN,
      trigger,
    });
    setIsCommandPaletteOpen(true);
    setCommandQuery("");
    setActiveCommandIndex(0);
  }, []);

  const openShortcutHelp = useCallback((trigger: PortfolioTelemetryTrigger = "pointer") => {
    emitPortfolioTelemetryEvent({
      channel: "navigation",
      action: PORTFOLIO_NAVIGATION_TELEMETRY_ACTION.SHORTCUT_HELP_OPEN,
      trigger,
    });
    setIsShortcutHelpOpen(true);
  }, []);

  const closeShortcutHelp = useCallback(() => {
    setIsShortcutHelpOpen(false);
  }, []);

  const emitPagerShortcutTelemetry = useCallback(
    (
      action: (typeof PORTFOLIO_PAGER_TELEMETRY_ACTION)[keyof typeof PORTFOLIO_PAGER_TELEMETRY_ACTION],
    ) => {
      emitPortfolioTelemetryEvent({
        channel: "pager",
        action,
        trigger: "keyboard-shortcut",
      });
    },
    [],
  );

  const dispatchShortcut = useCallback(
    (
      shortcutEventName: (typeof PORTFOLIO_SHORTCUT_EVENT)[keyof typeof PORTFOLIO_SHORTCUT_EVENT],
      action: (typeof PORTFOLIO_PAGER_TELEMETRY_ACTION)[keyof typeof PORTFOLIO_PAGER_TELEMETRY_ACTION],
    ) => {
      emitPortfolioShortcutEvent(shortcutEventName);
      emitPagerShortcutTelemetry(action);
    },
    [emitPagerShortcutTelemetry],
  );

  const executeCommandAction = useCallback(
    (action: CommandPaletteAction) => {
      closeCommandPalette();

      if (action.onSelect) {
        action.onSelect();
        return;
      }

      if (action.href) {
        window.location.assign(withBasePath(action.href));
      }
    },
    [closeCommandPalette],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette("keyboard-shortcut");
        return;
      }

      if (event.key === "?" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        openShortcutHelp("keyboard-shortcut");
        return;
      }

      if (event.altKey && !event.shiftKey && event.key === "ArrowLeft") {
        event.preventDefault();
        dispatchShortcut(
          PORTFOLIO_SHORTCUT_EVENT.HOME_PREV,
          PORTFOLIO_PAGER_TELEMETRY_ACTION.HOME_PREV_SHORTCUT,
        );
        return;
      }

      if (event.altKey && !event.shiftKey && event.key === "ArrowRight") {
        event.preventDefault();
        dispatchShortcut(
          PORTFOLIO_SHORTCUT_EVENT.HOME_NEXT,
          PORTFOLIO_PAGER_TELEMETRY_ACTION.HOME_NEXT_SHORTCUT,
        );
        return;
      }

      if (event.altKey && event.shiftKey && event.key === "ArrowLeft") {
        event.preventDefault();
        dispatchShortcut(
          PORTFOLIO_SHORTCUT_EVENT.SUB_PREV,
          PORTFOLIO_PAGER_TELEMETRY_ACTION.SUB_PREV_SHORTCUT,
        );
        return;
      }

      if (event.altKey && event.shiftKey && event.key === "ArrowRight") {
        event.preventDefault();
        dispatchShortcut(
          PORTFOLIO_SHORTCUT_EVENT.SUB_NEXT,
          PORTFOLIO_PAGER_TELEMETRY_ACTION.SUB_NEXT_SHORTCUT,
        );
        return;
      }

      if (event.altKey && event.ctrlKey && event.key === "ArrowLeft") {
        event.preventDefault();
        emitPortfolioShortcutEvent(PORTFOLIO_SHORTCUT_EVENT.MEDIA_PREV);
        return;
      }

      if (event.altKey && event.ctrlKey && event.key === "ArrowRight") {
        event.preventDefault();
        emitPortfolioShortcutEvent(PORTFOLIO_SHORTCUT_EVENT.MEDIA_NEXT);
        return;
      }

      if (event.altKey && event.ctrlKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        emitPortfolioShortcutEvent(PORTFOLIO_SHORTCUT_EVENT.MEDIA_LOOP);
        return;
      }

      if (event.key === "Escape" && isCommandPaletteOpen) {
        event.preventDefault();
        closeCommandPalette();
      }

      if (event.key === "Escape" && isShortcutHelpOpen) {
        event.preventDefault();
        closeShortcutHelp();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    closeCommandPalette,
    closeShortcutHelp,
    dispatchShortcut,
    isCommandPaletteOpen,
    isShortcutHelpOpen,
    openCommandPalette,
    openShortcutHelp,
  ]);

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      commandInputRef.current?.focus();
      commandInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (activeCommandIndex < filteredActions.length) {
      return;
    }
    setActiveCommandIndex(Math.max(0, filteredActions.length - 1));
  }, [activeCommandIndex, filteredActions.length]);

  const activePreviewAction =
    filteredActions.length > 0 ? filteredActions[Math.max(0, activeCommandIndex)] : null;
  const activePreviewTitle = activePreviewAction?.previewTitle ?? activePreviewAction?.label;
  const activePreviewBody = activePreviewAction?.previewBody ?? activePreviewAction?.subtitle;
  const activePreviewMeta = activePreviewAction?.previewMeta ?? activePreviewAction?.group;

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredActions.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCommandIndex((index) => (index + 1) % filteredActions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCommandIndex((index) => (index <= 0 ? filteredActions.length - 1 : index - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const action = filteredActions[activeCommandIndex];
      if (action) {
        executeCommandAction(action);
      }
    }
  };

  return (
    <>
      <StyledAppBar open={open} drawerWidth={drawerWidth} {...other}>
        <Toolbar sx={{ pr: "24px" }}>
          {children}
          <Tooltip title="Command Palette (Cmd/Ctrl+K)">
            <IconButton
              color="inherit"
              aria-label="Open command palette"
              onClick={() => openCommandPalette("pointer")}
              sx={{ ml: 0.5 }}
            >
              <Search />
            </IconButton>
          </Tooltip>
          <Tooltip title="Keyboard Shortcuts (?)">
            <IconButton
              color="inherit"
              aria-label="Open keyboard shortcuts help"
              onClick={() => openShortcutHelp("pointer")}
              sx={{ ml: 0.25 }}
            >
              <HelpOutline />
            </IconButton>
          </Tooltip>
          <Box
            sx={(theme) => ({
              ml: 0.5,
              mr: 0.5,
              display: { xs: "none", md: "inline-flex" },
              alignItems: "center",
              gap: 0.25,
              px: 0.75,
              py: 0.2,
              border: "1px solid",
              borderRadius: 1,
              borderColor: alpha(theme.palette.text.primary, 0.28),
              color: alpha(theme.palette.text.primary, 0.72),
              fontSize: "0.72rem",
              lineHeight: 1,
              userSelect: "none",
            })}
          >
            <KeyboardCommandKey sx={{ fontSize: "0.86rem" }} />
            <Typography component="span" sx={{ fontSize: "0.72rem", lineHeight: 1 }}>
              K
            </Typography>
          </Box>
          {toggleColorMode && <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />}
        </Toolbar>
      </StyledAppBar>

      <Dialog
        open={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        fullWidth
        maxWidth="sm"
        aria-labelledby="global-command-palette-title"
      >
        <DialogTitle id="global-command-palette-title" sx={{ pb: 1 }}>
          {commandPaletteTitle}
        </DialogTitle>
        <DialogContent sx={{ pt: 0, pb: 1.5 }}>
          <TextField
            fullWidth
            value={commandQuery}
            inputRef={commandInputRef}
            onChange={(event) => {
              setCommandQuery(event.target.value);
              setActiveCommandIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={commandPalettePlaceholder}
            size="small"
            autoComplete="off"
            spellCheck={false}
            sx={{ mb: 1.25 }}
          />
          <List
            dense
            sx={{
              maxHeight: 360,
              overflowY: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.25,
              py: 0.5,
            }}
          >
            {filteredActions.length === 0 ? (
              <Box sx={{ px: 1.5, py: 1.25 }}>
                <Typography variant="body2" color="text.secondary">
                  No commands match your search.
                </Typography>
              </Box>
            ) : (
              filteredActions.map((action, index) => (
                <ListItemButton
                  key={action.id}
                  selected={index === activeCommandIndex}
                  onMouseEnter={() => setActiveCommandIndex(index)}
                  onClick={() => executeCommandAction(action)}
                  sx={{ mx: 0.75, borderRadius: 1 }}
                >
                  <ListItemText
                    primary={action.label}
                    secondary={
                      action.subtitle || action.group
                        ? [action.group, action.subtitle].filter(Boolean).join(" • ")
                        : undefined
                    }
                    primaryTypographyProps={{ noWrap: true, fontWeight: 600 }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              ))
            )}
          </List>
          <Box
            sx={{
              mt: 1,
              px: 1.25,
              py: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.25,
              minHeight: 76,
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Keyboard Preview
            </Typography>
            {activePreviewAction ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {activePreviewTitle}
                </Typography>
                {activePreviewBody ? (
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                    {activePreviewBody}
                  </Typography>
                ) : null}
                {activePreviewMeta ? (
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1.3, color: "text.disabled", fontFamily: "monospace" }}
                  >
                    {activePreviewMeta}
                  </Typography>
                ) : null}
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Use ↑/↓ to preview results, then press Enter to open.
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isShortcutHelpOpen}
        onClose={closeShortcutHelp}
        fullWidth
        maxWidth="sm"
        aria-labelledby="keyboard-shortcuts-help-title"
      >
        <DialogTitle id="keyboard-shortcuts-help-title">Keyboard Shortcuts</DialogTitle>
        <DialogContent sx={{ pt: 0, pb: 1.25 }}>
          <List dense sx={{ py: 0 }}>
            {[
              { combo: "Cmd/Ctrl + K", action: "Open command palette" },
              { combo: "?", action: "Open keyboard shortcut help" },
              { combo: "Alt + ← / →", action: "Previous/next home section pager" },
              { combo: "Alt + Shift + ← / →", action: "Previous/next subsection pager" },
              { combo: "Alt + Ctrl + ← / →", action: "Previous/next media item" },
              { combo: "Alt + Ctrl + L", action: "Loop media item to first item" },
            ].map((entry) => (
              <ListItemButton key={entry.combo} disableRipple>
                <ListItemText
                  primary={entry.combo}
                  secondary={entry.action}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
}
