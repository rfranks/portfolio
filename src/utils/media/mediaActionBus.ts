import type { MediaActionBusEventDetail, MediaActionBusSource } from "@/types/media/mediaActionBus";
import type { PortfolioMediaActionBusEventName } from "@/types/media/mediaActionBus";
import { PORTFOLIO_MEDIA_ACTION_BUS_EVENT } from "@/consts/media/mediaActionBus";
import type { MediaActionContract } from "@/types/media/mediaActionContract";

export function emitMediaActionBusEvent(args: {
  action: MediaActionContract;
  source: MediaActionBusSource;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const detail: MediaActionBusEventDetail = {
    action: args.action,
    source: args.source,
    timestamp: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent<MediaActionBusEventDetail>(PORTFOLIO_MEDIA_ACTION_BUS_EVENT, {
      detail,
    }),
  );
}

export function addMediaActionBusListener(
  listener: (detail: MediaActionBusEventDetail) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const eventName: PortfolioMediaActionBusEventName = PORTFOLIO_MEDIA_ACTION_BUS_EVENT;
  const handler = (event: Event) => {
    const typedEvent = event as CustomEvent<MediaActionBusEventDetail>;
    listener(typedEvent.detail);
  };

  window.addEventListener(eventName, handler as EventListener);
  return () => {
    window.removeEventListener(eventName, handler as EventListener);
  };
}
