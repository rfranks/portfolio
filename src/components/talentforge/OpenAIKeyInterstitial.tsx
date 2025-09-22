"use client";

import * as React from "react";

import OpenAIKeyInterstitialContent from "@/components/OpenAIKeyInterstitialContent";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";

export default function OpenAIKeyInterstitial() {
  const { key, setKey } = useOpenAIKey();
  const [value, setValue] = React.useState(key);
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setKey(trimmed);
    setValue(trimmed);
  };

  return (
    <OpenAIKeyInterstitialContent
      appName="TalentForge"
      logoAlt="TalentForge logo"
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      inputRef={inputRef}
    />
  );
}
