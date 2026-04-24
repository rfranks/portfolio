import readline from "node:readline/promises";

const supportsColor = (output: NodeJS.WriteStream) =>
  Boolean(output.isTTY) && !("NO_COLOR" in process.env) && process.env.TERM !== "dumb";

const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
} as const;

const uiIcons = {
  section: "🧭",
  prompt: "❯",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "ℹ️",
} as const;

type AnsiKey = keyof typeof ansi;

export type WizardReadline = ReturnType<typeof readline.createInterface>;

export type AskTextOptions = {
  defaultValue?: string;
  required?: boolean;
  transform?: (value: string) => string;
};

export type ChoiceOption<TValue = string> = {
  label: string;
  value: TValue;
  description?: string;
};

export function createWizardUi(output: NodeJS.WriteStream) {
  const paint = (text: string, ...styles: AnsiKey[]): string => {
    if (!supportsColor(output) || styles.length === 0) {
      return text;
    }
    const prefix = styles.map((style) => ansi[style]).join("");
    return `${prefix}${text}${ansi.reset}`;
  };

  const writeLine = (line = ""): void => {
    output.write(`${line}\n`);
  };

  const writeSection = (title: string): void => {
    writeLine();
    writeLine(paint(`${uiIcons.section} ${title}`, "bold", "magenta"));
  };

  const writeInfo = (message: string): void => {
    writeLine(`${paint(uiIcons.info, "cyan")} ${message}`);
  };

  const writeSuccess = (message: string): void => {
    writeLine(`${paint(uiIcons.success, "green")} ${paint(message, "green")}`);
  };

  const writeWarning = (message: string): void => {
    writeLine(`${paint(uiIcons.warning, "yellow")} ${paint(message, "yellow")}`);
  };

  const writeError = (message: string): void => {
    writeLine(`${paint(uiIcons.error, "red")} ${paint(message, "red")}`);
  };

  const askText = async (
    rl: WizardReadline,
    prompt: string,
    options: AskTextOptions = {},
  ): Promise<string> => {
    const { defaultValue = "", required = false, transform } = options;
    for (;;) {
      const defaultSuffix = defaultValue ? ` (${defaultValue})` : "";
      const answer = await rl.question(
        `${paint(uiIcons.prompt, "cyan")} ${paint(prompt, "bold")}${paint(defaultSuffix, "dim")}: `,
      );
      const resolved = answer.trim() || defaultValue;
      const finalValue = transform ? transform(resolved) : resolved;
      if (required && !String(finalValue).trim()) {
        writeError("Please provide a value.");
        continue;
      }
      return finalValue;
    }
  };

  const askYesNo = async (
    rl: WizardReadline,
    prompt: string,
    defaultYes = true,
  ): Promise<boolean> => {
    const hint = defaultYes ? "Y/n" : "y/N";
    for (;;) {
      const answer = (
        await rl.question(
          `${paint(uiIcons.prompt, "cyan")} ${paint(prompt, "bold")} ${paint(`[${hint}]`, "dim")}: `,
        )
      )
        .trim()
        .toLowerCase();
      if (!answer) {
        return defaultYes;
      }
      if (["y", "yes"].includes(answer)) {
        return true;
      }
      if (["n", "no"].includes(answer)) {
        return false;
      }
      writeError("Please answer yes or no.");
    }
  };

  const chooseOne = async <TValue,>(
    rl: WizardReadline,
    prompt: string,
    options: ChoiceOption<TValue>[],
    defaultIndex = 0,
  ): Promise<ChoiceOption<TValue>> => {
    writeLine();
    writeLine(paint(prompt, "bold", "cyan"));
    options.forEach((option, idx) => {
      const number = idx + 1;
      const description = option.description ? ` — ${option.description}` : "";
      writeLine(`  ${paint(`${number}.`, "bold")} ${option.label}${paint(description, "dim")}`);
    });

    for (;;) {
      const answer = await rl.question(
        `${paint(uiIcons.prompt, "cyan")} ${paint(`Choose [1-${options.length}]`, "bold")} ${paint(`(default ${defaultIndex + 1})`, "dim")}: `,
      );
      if (!answer.trim()) {
        return options[defaultIndex];
      }
      const numeric = Number.parseInt(answer.trim(), 10);
      if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
        return options[numeric - 1];
      }
      writeError("Invalid choice. Try again.");
    }
  };

  const chooseIndex = async (
    rl: WizardReadline,
    prompt: string,
    labels: string[],
  ): Promise<number> => {
    writeLine();
    writeLine(paint(prompt, "bold", "cyan"));
    labels.forEach((label, idx) => {
      writeLine(`  ${paint(`${idx + 1}.`, "bold")} ${label}`);
    });

    for (;;) {
      const answer = await rl.question(
        `${paint(uiIcons.prompt, "cyan")} ${paint(`Choose [1-${labels.length}]`, "bold")}: `,
      );
      const numeric = Number.parseInt(answer.trim(), 10);
      if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= labels.length) {
        return numeric - 1;
      }
      writeError("Invalid choice. Try again.");
    }
  };

  return {
    paint,
    writeLine,
    writeSection,
    writeInfo,
    writeSuccess,
    writeWarning,
    writeError,
    askText,
    askYesNo,
    chooseOne,
    chooseIndex,
  };
}
