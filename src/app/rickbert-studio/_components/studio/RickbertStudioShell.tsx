"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type Konva from "konva";
import Image from "next/image";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { ComicStage } from "@/app/rickbert-studio/_components/comic";
import { exportStageAsPng } from "@/app/rickbert-studio/_export/pngExport";
import { requestFinalRender } from "@/app/rickbert-studio/_features/finalRender";
import { useRickbertStudioStore } from "@/app/rickbert-studio/_store";
import { CHARACTER_CONFIGS } from "@/app/rickbert-studio/_domain/characterConfigs";
import { setRickbertOpenAIKey } from "@/app/rickbert-studio/_utils/openAIKey";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";

function JsonView({ data, onCopy }: { data: unknown; onCopy: () => void }) {
  return (
    <div className="overflow-hidden rounded-md bg-slate-900">
      <div className="flex items-center justify-end border-b border-slate-700 bg-slate-800/70 p-1 text-slate-100">
        <Tooltip title="Copy JSON">
          <IconButton
            size="small"
            color="inherit"
            aria-label="Copy JSON"
            onClick={onCopy}
            sx={{ color: "inherit" }}
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </div>
      <pre className="max-h-[62vh] overflow-auto p-3 text-xs leading-5 text-slate-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function RickbertStudioShell() {
  const stageRef = useRef<Konva.Stage>(null);
  const docFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const copyToClipboard = useCopyToClipboard();
  const [runningAction, setRunningAction] = useState<
    null | "parse" | "validate" | "render" | "aiRender"
  >(null);
  const [finalImageDimensions, setFinalImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const {
    masterPrompt,
    referenceDocs,
    stripRequest,
    parsedSpec,
    renderedSpec,
    validationReport,
    renderSettings,
    activeTab,
    errorMessage,
    openAIKey,
    styleReferenceDataUrl,
    finalRenderUseOutlineGuide,
    characterMapOverrides,
    finalRenderImageDataUrl,
    finalRenderResponseId,
    finalRenderStatus,
    finalRenderError,
    setMasterPrompt,
    setReferenceDoc,
    setStripRequest,
    setOpenAIKey,
    setStyleReferenceDataUrl,
    setFinalRenderUseOutlineGuide,
    setCharacterMapOverrides,
    parse,
    validate,
    render,
    reset,
    loadSample,
    setActiveTab,
    setRenderSettings,
    beginFinalRender,
    completeFinalRender,
    failFinalRender,
    clearFinalRender,
  } = useRickbertStudioStore();

  const visibleSpec = renderedSpec ?? parsedSpec;
  const [characterMapDraft, setCharacterMapDraft] = useState(
    JSON.stringify(characterMapOverrides, null, 2)
  );
  const [characterMapDraftError, setCharacterMapDraftError] = useState<string | null>(
    null
  );

  const copyText = (value: string) => {
    void copyToClipboard(value);
  };

  const characterMap = useMemo(() => {
    const base: Record<string, unknown> = {};

    Object.entries(characterMapOverrides).forEach(([name, value]) => {
      base[name] = {
        type: "custom",
        ...value,
      };
    });

    if (!visibleSpec) {
      return base;
    }

    const seen = new Set<string>();
    visibleSpec.panels.forEach((panel) => {
      panel.characters.forEach((character) => {
        seen.add(character.name);
      });
    });

    return Array.from(seen).reduce<Record<string, unknown>>((acc, name) => {
      acc[name] =
        CHARACTER_CONFIGS[name] ??
        characterMapOverrides[name] ?? { note: "No canonical config" };
      return acc;
    }, base);
  }, [characterMapOverrides, visibleSpec]);

  useEffect(() => {
    setCharacterMapDraft(JSON.stringify(characterMapOverrides, null, 2));
  }, [characterMapOverrides]);

  useEffect(() => {
    setFinalImageDimensions(null);
  }, [finalRenderImageDataUrl]);

  const openDocFilePicker = (docId: string) => {
    docFileInputRefs.current[docId]?.click();
  };

  const handleDocReferenceFileUpload = async (
    docId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const content = await file.text();
    setReferenceDoc(docId, content);
    event.target.value = "";
  };

  const handleStyleReferenceUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      failFinalRender("Style reference image is too large. Please use a file under 6MB.");
      event.target.value = "";
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read style reference image."));
      reader.readAsDataURL(file);
    }).catch((error) => {
      failFinalRender(error instanceof Error ? error.message : "Failed to read style image.");
      return "";
    });

    if (dataUrl) {
      setStyleReferenceDataUrl(dataUrl);
    }

    event.target.value = "";
  };

  const handleFinalRender = async () => {
    if (!visibleSpec) {
      failFinalRender("Parse and render a strip before running AI Render.");
      return;
    }

    if (!validationReport?.pass) {
      failFinalRender("Validation must pass before AI Render.");
      return;
    }

    const outlineDataUrl = finalRenderUseOutlineGuide
      ? stageRef.current?.toDataURL({ pixelRatio: 1 })
      : undefined;

    if (finalRenderUseOutlineGuide && !outlineDataUrl) {
      failFinalRender("Unable to capture outline preview from canvas.");
      return;
    }

    beginFinalRender();
    setRunningAction("aiRender");

    try {
      const response = await requestFinalRender({
        apiKey: openAIKey.trim() || undefined,
        masterPrompt,
        referenceDocs,
        stripSpec: visibleSpec,
        validationReport,
        outlineDataUrl,
        styleReferenceDataUrl: styleReferenceDataUrl ?? undefined,
      });

      completeFinalRender(response.imageDataUrl, response.responseId ?? null);
    } catch (error) {
      failFinalRender(
        error instanceof Error ? error.message : "Final render request failed."
      );
    } finally {
      setRunningAction((current) => (current === "aiRender" ? null : current));
    }
  };

  const runQuickAction = (
    action: "parse" | "validate" | "render",
    fn: () => void
  ) => {
    setRunningAction(action);
    fn();
    window.setTimeout(() => {
      setRunningAction((current) => (current === action ? null : current));
    }, 180);
  };

  const actionSpinner = (
    action: "parse" | "validate" | "render" | "aiRender"
  ) =>
    runningAction === action ? (
      <CircularProgress size={14} color="inherit" />
    ) : undefined;

  const structuredOutputTabs = [
    { value: "parsed", label: "Parsed Spec" },
    { value: "validation", label: "Validation Report" },
    { value: "render", label: "Render Settings" },
    { value: "characters", label: "Character Map" },
    { value: "final", label: "AI Image" },
  ] as const;

  const applyCharacterMapOverrides = () => {
    try {
      const parsed = JSON.parse(characterMapDraft) as Record<
        string,
        { role?: "human" | "device"; notes?: string; aliasOf?: string }
      >;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setCharacterMapDraftError("Character map must be a JSON object.");
        return;
      }

      setCharacterMapOverrides(parsed);
      setCharacterMapDraftError(null);
    } catch (error) {
      setCharacterMapDraftError(
        error instanceof Error ? error.message : "Invalid character map JSON."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-200 via-orange-50 to-stone-100 text-slate-900">
      <header className="border-b border-stone-300 bg-stone-100/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1860px] flex-wrap items-center gap-2">
          <h1 className="mr-3 text-lg font-black tracking-wide">RICKBERT STUDIO</h1>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => runQuickAction("parse", parse)}
            startIcon={actionSpinner("parse")}
          >
            Parse
          </Button>
          <Button
            variant="contained"
            size="small"
            color="info"
            onClick={() => runQuickAction("validate", validate)}
            startIcon={actionSpinner("validate")}
          >
            Validate
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={() => runQuickAction("render", render)}
            startIcon={actionSpinner("render")}
          >
            Render
          </Button>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={handleFinalRender}
            disabled={!visibleSpec || finalRenderStatus === "loading"}
            startIcon={actionSpinner("aiRender")}
          >
            <span className={runningAction === "aiRender" ? "shimmer-text" : undefined}>
              {finalRenderStatus === "loading" ? "AI Rendering" : "AI Render"}
            </span>
          </Button>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => exportStageAsPng(stageRef.current)}
            disabled={!visibleSpec}
          >
            Export PNG
          </Button>
          <Button variant="outlined" size="small" color="inherit" onClick={reset}>
            Reset
          </Button>
          <Button
            variant="contained"
            size="small"
            color="warning"
            onClick={loadSample}
          >
            Load Sample
          </Button>

          <div className="ml-auto text-sm">
            Preflight:
            <Chip
              size="small"
              className="ml-2"
              color={
                validationReport
                  ? validationReport.pass
                    ? "success"
                    : "error"
                  : "default"
              }
              label={
                validationReport
                  ? validationReport.pass
                    ? "PASS"
                    : "FAIL"
                  : "Not run"
              }
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1860px] gap-4 p-4 lg:grid-cols-2 xl:grid-cols-[1.06fr_1.38fr_1fr]">
        <section className="min-w-0 rounded-lg border border-stone-300 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-600">
            Inputs
          </h2>

          <form
            className="mb-3"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="text"
              name="username"
              autoComplete="username"
              value="rickbert-user"
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
            <label className="mb-1 block text-xs font-semibold text-stone-700">
              OpenAI API Key
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded border border-stone-300 p-2 text-xs"
              value={openAIKey}
              onChange={(event) => {
                const nextKey = event.target.value;
                setOpenAIKey(nextKey);
                setRickbertOpenAIKey(nextKey);
              }}
              placeholder="sk-..."
            />
          </form>

          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-700">
              Master System Prompt
            </label>
            <Tooltip title="Copy text">
              <IconButton size="small" onClick={() => copyText(masterPrompt)}>
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </div>
          <textarea
            className="mb-3 h-24 w-full rounded border border-stone-300 p-2 text-xs"
            value={masterPrompt}
            onChange={(event) => setMasterPrompt(event.target.value)}
          />

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">Reference Docs</span>
            <button
              className="rounded border border-stone-300 px-2 py-1 text-[11px]"
              onClick={loadSample}
            >
              Load sample Rickbert script
            </button>
          </div>

          <div className="space-y-3">
            {referenceDocs.map((doc) => (
              <div key={doc.id}>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    className="block cursor-pointer text-[11px] font-semibold text-stone-600"
                    onDoubleClick={() => openDocFilePicker(doc.id)}
                    title="Double-click to load local markdown file"
                  >
                    {doc.name}
                  </label>
                  <div className="flex items-center gap-1">
                    <Tooltip title="Copy text">
                      <IconButton
                        size="small"
                        onClick={() => copyText(doc.content)}
                      >
                        <ContentCopyIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Load from local file">
                      <IconButton
                        size="small"
                        onClick={() => openDocFilePicker(doc.id)}
                      >
                        <UploadFileIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".md,text/markdown,text/plain"
                  className="hidden"
                  ref={(element) => {
                    docFileInputRefs.current[doc.id] = element;
                  }}
                  onChange={(event) => handleDocReferenceFileUpload(doc.id, event)}
                />
                <textarea
                  className="h-24 w-full rounded border border-stone-300 p-2 text-xs"
                  value={doc.content}
                  onChange={(event) => setReferenceDoc(doc.id, event.target.value)}
                />
              </div>
            ))}
          </div>

          <label className="mb-1 mt-3 block text-xs font-semibold text-stone-700">
            Style Reference Image (optional)
          </label>
          <div className="mb-3 flex items-center gap-2">
            <label className="cursor-pointer rounded border border-stone-300 px-2 py-1 text-[11px]">
              Upload style PNG/JPG
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleStyleReferenceUpload}
              />
            </label>
            {styleReferenceDataUrl && (
              <button
                className="rounded border border-stone-300 px-2 py-1 text-[11px]"
                onClick={() => setStyleReferenceDataUrl(null)}
              >
                Clear
              </button>
            )}
            <span className="text-[11px] text-stone-600">
              {styleReferenceDataUrl ? "Style image loaded" : "No style image loaded"}
            </span>
          </div>

          <label className="mb-1 block text-xs font-semibold text-stone-700">
            AI Render Guidance
          </label>
          <label className="mb-3 flex items-center gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              checked={finalRenderUseOutlineGuide}
              onChange={(event) =>
                setFinalRenderUseOutlineGuide(event.target.checked)
              }
            />
            Use current outline render as layout guide (can increase stick-figure bias)
          </label>

          <div className="mb-1 mt-3 flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-700">
              Strip Request / Script
            </label>
            <Tooltip title="Copy text">
              <IconButton size="small" onClick={() => copyText(stripRequest)}>
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </div>
          <textarea
            className="h-64 w-full rounded border border-stone-300 p-2 font-mono text-xs"
            value={stripRequest}
            onChange={(event) => setStripRequest(event.target.value)}
          />
        </section>

        <section className="min-w-0 rounded-lg border border-stone-300 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-600">
            Comic Preview
          </h2>
          <div className="overflow-auto rounded border border-stone-200 bg-stone-50 p-2">
            {visibleSpec ? (
              <ComicStage spec={visibleSpec} settings={renderSettings} stageRef={stageRef} />
            ) : (
              <div className="flex h-[540px] items-center justify-center rounded border border-dashed border-stone-300 text-sm text-stone-500">
                Parse and render a strip to preview.
              </div>
            )}
          </div>
          {errorMessage && (
            <p className="mt-3 rounded bg-rose-100 px-3 py-2 text-sm text-rose-900">
              {errorMessage}
            </p>
          )}
          {finalRenderError && (
            <p className="mt-3 rounded bg-rose-100 px-3 py-2 text-sm text-rose-900">
              {finalRenderError}
            </p>
          )}
        </section>

        <section className="min-w-0 rounded-lg border border-stone-300 bg-white p-3 shadow-sm lg:col-span-2 xl:col-span-1">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-600">
            Structured Output
          </h2>

          <div className="mb-3 overflow-x-auto border-b border-stone-200">
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Structured output tabs"
              sx={{
                minHeight: 40,
                "& .MuiTab-root": {
                  minHeight: 40,
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 600,
                },
              }}
            >
              {structuredOutputTabs.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>
          </div>

          {activeTab === "parsed" && (
            <JsonView
              data={parsedSpec ?? { status: "Not parsed" }}
              onCopy={() => copyText(JSON.stringify(parsedSpec ?? { status: "Not parsed" }, null, 2))}
            />
          )}
          {activeTab === "validation" && (
            <JsonView
              data={validationReport ?? { status: "Validation not run" }}
              onCopy={() =>
                copyText(
                  JSON.stringify(
                    validationReport ?? { status: "Validation not run" },
                    null,
                    2
                  )
                )
              }
            />
          )}
          {activeTab === "characters" && (
            <div className="space-y-3 rounded bg-stone-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Character Map Overrides (JSON)
                </label>
                <Tooltip title="Copy text">
                  <IconButton
                    size="small"
                    onClick={() => copyText(characterMapDraft)}
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </div>
              <textarea
                className="h-40 w-full rounded border border-stone-300 p-2 font-mono text-xs"
                value={characterMapDraft}
                onChange={(event) => setCharacterMapDraft(event.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button size="small" variant="contained" onClick={applyCharacterMapOverrides}>
                  Apply Character Map
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setCharacterMapDraft(JSON.stringify(characterMapOverrides, null, 2))
                  }
                >
                  Reset Draft
                </Button>
              </div>
              {characterMapDraftError && (
                <p className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-900">
                  {characterMapDraftError}
                </p>
              )}
              <JsonView
                data={characterMap}
                onCopy={() => copyText(JSON.stringify(characterMap, null, 2))}
              />
            </div>
          )}

          {activeTab === "final" && (
            <div className="space-y-3 rounded bg-stone-50 p-3 text-sm">
              {finalRenderStatus === "loading" && (
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <CircularProgress size={20} />
                  <span className="shimmer-text">Generating AI image...</span>
                </div>
              )}
              {finalRenderImageDataUrl ? (
                <>
                  <div className="w-full overflow-auto rounded border border-stone-300 bg-white p-1">
                    <div className="relative h-[70vh] w-full min-w-[320px]">
                      <Image
                        src={finalRenderImageDataUrl}
                        alt="Final Rickbert render"
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 33vw, 100vw"
                        style={{ objectFit: "contain" }}
                        onLoad={(event) => {
                          const target = event.currentTarget;
                          setFinalImageDimensions({
                            width: target.naturalWidth,
                            height: target.naturalHeight,
                          });
                        }}
                      />
                    </div>
                    <span className="sr-only">
                      AI render preview
                    </span>
                  </div>
                  {finalImageDimensions && (
                    <p className="text-[11px] text-stone-600">
                      Image size: {finalImageDimensions.width}x{finalImageDimensions.height}
                      {finalImageDimensions.width <= finalImageDimensions.height
                        ? " (non-landscape output; retry AI Render for wider framing)"
                        : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      href={finalRenderImageDataUrl}
                      download="rickbert-ai-render.png"
                    >
                      Download AI PNG
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={clearFinalRender}
                    >
                      Clear
                    </Button>
                  </div>
                  {finalRenderResponseId && (
                    <p className="text-[11px] text-stone-600">
                      OpenAI response id: {finalRenderResponseId}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-stone-600">
                  Run AI Render after validation passes to generate the polished comic image.
                </p>
              )}
            </div>
          )}

          {activeTab === "render" && (
            <div className="space-y-3 rounded bg-stone-50 p-3 text-sm">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700">
                  Stage Width
                </label>
                <input
                  type="number"
                  className="w-full rounded border border-stone-300 px-2 py-1"
                  value={renderSettings.stageWidth}
                  onChange={(event) =>
                    setRenderSettings({
                      stageWidth:
                        Number(event.target.value) || renderSettings.stageWidth,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700">
                  Stage Height
                </label>
                <input
                  type="number"
                  className="w-full rounded border border-stone-300 px-2 py-1"
                  value={renderSettings.stageHeight}
                  onChange={(event) =>
                    setRenderSettings({
                      stageHeight:
                        Number(event.target.value) || renderSettings.stageHeight,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700">
                  Panel Gap
                </label>
                <input
                  type="range"
                  min={8}
                  max={32}
                  value={renderSettings.panelGap}
                  onChange={(event) =>
                    setRenderSettings({ panelGap: Number(event.target.value) })
                  }
                />
                <span className="ml-2 text-xs text-stone-600">
                  {renderSettings.panelGap}px
                </span>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
