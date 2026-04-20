"use client";

import * as React from "react";

import { OpenAIKeyInterstitialContent } from "@/components/shared";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";
import { validateOpenAIKey } from "@/app/talentforge/_utils/utils";

export default function OpenAIKeyInterstitial() {
  const { key, setKey } = useOpenAIKey();
  const [value, setValue] = React.useState(key);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | undefined>(
    undefined,
  );
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const previousFocusRef = React.useRef<Element | null>(null);

  React.useEffect(() => {
    setValue(key);
  }, [key]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    previousFocusRef.current = document.activeElement;
    inputRef.current?.focus();

    return () => {
      const previous = previousFocusRef.current;
      if (
        previous &&
        previous instanceof HTMLElement &&
        typeof previous.focus === "function"
      ) {
        previous.focus();
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setErrorText(undefined);
    try {
      const result = await validateOpenAIKey(trimmed);
      if (!result.ok) {
        setErrorText(
          result.error ??
            "Unable to verify this key with OpenAI. Check the key and try again.",
        );
        return;
      }
      setKey(trimmed, { validity: "valid" });
      setValue(trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OpenAIKeyInterstitialContent
      appName="TalentForge"
      logoAlt="TalentForge logo"
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      inputRef={inputRef}
      isSubmitting={isSubmitting}
      errorText={errorText}
    />
  );
}
