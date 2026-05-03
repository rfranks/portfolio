import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { AttachFile, Edit, MoreVert } from "@mui/icons-material";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { visuallyHidden } from "@mui/utils";
import type { JobApplication, OfferDecisionStatus, ResumeEntry } from "@/types";
import { OFFER_DECISION_DEFAULT_STATUS } from "@/types";
import { getPromptTile } from "@/app/talentforge/_utils/promptRegistry";
import type { PromptContext } from "@/app/talentforge/_utils/promptRegistry";
import { STATUSES } from "@/app/talentforge/_utils/keyboard";
import Chip from "@/components/fabric/Chip";
import { formatDecisionStatus } from "./formatters";

export interface ApplicationCardProps {
  app: JobApplication;
  onRunTile: (id: string, context: PromptContext) => void;
  onOpenWorkspace: (app: JobApplication) => void;
  onOpenDetails: (app: JobApplication) => void;
  onToggleSelect: (app: JobApplication, checked: boolean, options?: { range?: boolean }) => void;
  onQuickEditReminder: (app: JobApplication) => void;
  resumes: ResumeEntry[];
  onAssignResume: (appId: string, resumeId: string) => void;
  onSetInterviewDate: (appId: string, value: string) => void;
  onSetInterviewLocation: (appId: string, value: string) => void;
  onDownloadInvite: (app: JobApplication) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, app: JobApplication) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  activeId: string | null;
  selected: boolean;
}

export default function ApplicationCard({
  app,
  onRunTile,
  onOpenWorkspace,
  onOpenDetails,
  onToggleSelect,
  onQuickEditReminder,
  resumes,
  onAssignResume,
  onSetInterviewDate,
  onSetInterviewLocation,
  onDownloadInvite,
  onOpenMenu,
  onKeyDown,
  activeId,
  selected,
}: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    data: { type: "card", status: app.status },
  });
  const pointerStart = React.useRef<{ x: number; y: number } | null>(null);
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  } as const;
  const selectionLabelId = `application-${app.id}-selector`;
  const selectionLabel = [
    app.role.title ? `Select ${app.role.title}` : "Select application",
    app.role.company ? `at ${app.role.company}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dueDate = app.dueAt ? new Date(app.dueAt) : null;
  const hasValidDue = dueDate instanceof Date && !Number.isNaN(dueDate.getTime());
  const isOverdue = hasValidDue ? dueDate.getTime() < Date.now() : false;
  const dueLabel = hasValidDue
    ? dueDate.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const dueChipLabel = hasValidDue ? `${isOverdue ? "Overdue" : "Due"}: ${dueLabel}` : "";
  const hasReminder = Boolean(app.nextAction) || hasValidDue;
  const interviewDateRaw =
    typeof app.interviewDateTime === "string" ? app.interviewDateTime.trim() : "";
  const hasValidInterviewTime =
    Boolean(interviewDateRaw) && !Number.isNaN(new Date(interviewDateRaw).getTime());

  const decision = app.decision ?? app.offer?.decision;
  const decisionStatus: OfferDecisionStatus = decision?.status ?? OFFER_DECISION_DEFAULT_STATUS;
  const decisionLabel = formatDecisionStatus(decisionStatus);
  const decisionChipColor =
    decisionStatus === "accepted" ? "success" : decisionStatus === "declined" ? "error" : "default";
  const attachmentCount = app.attachments?.length ?? 0;
  const screenRoleAnalysis = app.screenRoleAnalysis;
  const screenRoleSummary = screenRoleAnalysis?.summary?.trim();
  const screenRoleIssues = screenRoleAnalysis?.issues ?? [];
  const hasScreenRoleAnalysis = Boolean(screenRoleSummary) || screenRoleIssues.length > 0;

  const offerNegotiationTile = getPromptTile("offerNegotiation", {
    contexts: "offers",
  });
  const compareCurrentCompTile = getPromptTile("compareCurrentComp", {
    contexts: "offers",
  });

  const handlePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    if (start) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        pointerStart.current = null;
        return;
      }
    }
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "button, [role='button'], a, input, textarea, select, [contenteditable='true']",
      )
    ) {
      pointerStart.current = null;
      return;
    }
    pointerStart.current = null;
    onOpenDetails(app);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const nativeEvent = event.nativeEvent as MouseEvent | KeyboardEvent;
    const range = typeof nativeEvent.shiftKey === "boolean" ? nativeEvent.shiftKey : false;
    onToggleSelect(app, event.target.checked, { range });
  };

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="listitem"
      aria-roledescription="draggable"
      aria-grabbed={activeId === app.id}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDownCapture={handlePointerDownCapture}
      onClick={handleClick}
      sx={{
        p: 1,
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 1,
        bgcolor: selected ? "action.selected" : "background.default",
        boxShadow: selected ? 3 : undefined,
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
        ...style,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.5 }}>
        <Box sx={{ position: "relative" }}>
          <Typography component="span" id={selectionLabelId} sx={{ ...visuallyHidden }}>
            {selectionLabel}
          </Typography>
          <Checkbox
            size="small"
            checked={selected}
            onChange={handleCheckboxChange}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            inputProps={{ "aria-labelledby": selectionLabelId }}
            sx={{ p: 0.5, mt: -0.5 }}
          />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography fontWeight="bold">{app.role.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {app.role.company} – {app.role.location}
          </Typography>
          {app.role.source && (
            <Typography variant="body2" color="text.secondary">
              Source: {app.role.source}
            </Typography>
          )}
          {hasScreenRoleAnalysis && (
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {screenRoleSummary && (
                <Typography variant="body2" color="text.secondary">
                  {screenRoleSummary}
                </Typography>
              )}
              {screenRoleIssues.length > 0 && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ flexWrap: "wrap", rowGap: 0.5 }}
                  useFlexGap
                >
                  {screenRoleIssues.map((issue, idx) => {
                    const label = issue.severity === "red" ? "Red flag" : "Caution";
                    return (
                      <Tooltip
                        key={`${issue.severity}-${idx}-${issue.message}`}
                        title={issue.message}
                      >
                        <Chip
                          label={label}
                          size="small"
                          color={issue.severity === "red" ? "error" : "warning"}
                          variant="filled"
                          aria-label={`${label}: ${issue.message}`}
                        />
                      </Tooltip>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }} useFlexGap>
            <Chip
              label={`Decision: ${decisionLabel}`}
              color={decisionChipColor === "default" ? "default" : decisionChipColor}
              variant={decisionChipColor === "default" ? "outlined" : "filled"}
              size="small"
            />
            {attachmentCount > 0 && (
              <Chip
                icon={<AttachFile fontSize="small" />}
                label={`${attachmentCount} ${attachmentCount === 1 ? "attachment" : "attachments"}`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
        <Tooltip title="Application actions">
          <IconButton
            size="small"
            aria-label="Application actions"
            onClick={(event) => onOpenMenu(event, app)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      {hasReminder && (
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1 }}>
          <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
            {app.nextAction && (
              <Typography variant="body2" color="text.primary">
                {app.nextAction}
              </Typography>
            )}
            {hasValidDue && dueChipLabel && (
              <Chip
                label={dueChipLabel}
                color={isOverdue ? "error" : "default"}
                size="small"
                sx={{ alignSelf: "flex-start" }}
              />
            )}
          </Stack>
          <Tooltip title="Edit next action">
            <IconButton
              size="small"
              color={isOverdue ? "error" : "default"}
              onClick={(event) => {
                event.stopPropagation();
                onQuickEditReminder(app);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Edit next action"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
      {resumes.length > 0 && app.status !== "offer" && (
        <TextField
          select
          size="small"
          label="Resume"
          value={app.resumeVariant?.id || ""}
          onChange={(e) => onAssignResume(app.id, e.target.value)}
          sx={{ mt: 1, mb: app.role.description ? 1 : 0 }}
          fullWidth
        >
          {resumes.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.title}
            </MenuItem>
          ))}
        </TextField>
      )}
      {STATUSES.indexOf(app.status) >= STATUSES.indexOf("interview") && app.status !== "offer" && (
        <Stack spacing={1} sx={{ mt: 1, mb: app.role.description ? 1 : 0 }}>
          <TextField
            type="datetime-local"
            size="small"
            label="Interview Time"
            value={app.interviewDateTime || ""}
            onChange={(e) => onSetInterviewDate(app.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "flex-end" }}
          >
            <TextField
              size="small"
              label="Meeting URL/Location"
              value={app.interviewLocation || ""}
              onChange={(e) => onSetInterviewLocation(app.id, e.target.value)}
              fullWidth
              sx={{ flexGrow: 1 }}
            />
            <Button
              size="small"
              variant="outlined"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDownloadInvite(app)}
              disabled={!hasValidInterviewTime}
              sx={{
                alignSelf: { xs: "stretch", sm: "flex-end" },
                whiteSpace: "nowrap",
              }}
            >
              Download invite
            </Button>
          </Stack>
        </Stack>
      )}
      <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpenWorkspace(app)}
          fullWidth
        >
          Open Workspace
        </Button>
        {app.role.description && (
          <>
            <Button
              size="small"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRunTile("screenRole", "jobSearch")}
              variant="outlined"
              fullWidth
            >
              Analyze Risks
            </Button>
            {app.status !== "offer" && (
              <>
                <Button
                  size="small"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRunTile("resumeCompare", "resume")}
                  variant="outlined"
                  fullWidth
                >
                  Compare to Resume
                </Button>
                <Button
                  size="small"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRunTile("coverLetter", "resume")}
                  variant="outlined"
                  fullWidth
                >
                  Cover Letter
                </Button>
              </>
            )}
          </>
        )}
      </Stack>
      {app.status === "offer" && (
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRunTile("offerDetails", "offers")}
            variant="outlined"
            fullWidth
          >
            {app.offer ? "Replace Offer Letter" : "Upload Offer Letter"}
          </Button>
          {app.offer && app.offer.compensation.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {app.offer.compensation.map((c) => (
                <Typography key={c.type} variant="body2">
                  {c.type.charAt(0).toUpperCase() + c.type.slice(1)}: {"$"}
                  {c.amount.toLocaleString()} {c.notes ? `(${c.notes})` : ""}
                </Typography>
              ))}
            </Stack>
          )}
          {app.offer?.summary && (
            <>
              <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                {app.offer.summary.map((line, idx) => (
                  <Box component="li" key={idx}>
                    <Typography variant="body2">{line}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                size="small"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRunTile("offerNegotiation", "offers")}
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
              >
                {offerNegotiationTile?.display || "Renegotiation Offer"}
              </Button>
              <Button
                size="small"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRunTile("compareCurrentComp", "offers")}
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
              >
                {compareCurrentCompTile?.display || "Compare to Current Comp"}
              </Button>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
