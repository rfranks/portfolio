import type {
  PortfolioTelemetryEventDetail,
  PortfolioWindowEventDetailMap,
  PortfolioWindowEventName,
  PortfolioWindowShortcutEventName,
} from "@/types/observability/telemetryEvents";
import { emitPortfolioTelemetryEventThroughBus } from "@/utils/observability/telemetryEventBus";

type DetailArgs<K extends PortfolioWindowEventName> =
  PortfolioWindowEventDetailMap[K] extends undefined
    ? []
    : [detail: PortfolioWindowEventDetailMap[K]];

export function emitPortfolioWindowEvent<K extends PortfolioWindowEventName>(
  name: K,
  ...detailArgs: DetailArgs<K>
): void {
  if (typeof window === "undefined") {
    return;
  }

  const detail = detailArgs[0];
  if (detail === undefined) {
    window.dispatchEvent(new CustomEvent(name));
    return;
  }

  window.dispatchEvent(
    new CustomEvent<PortfolioWindowEventDetailMap[K]>(name, {
      detail,
    }),
  );
}

export function emitPortfolioShortcutEvent(name: PortfolioWindowShortcutEventName): void {
  emitPortfolioWindowEvent(name);
}

export function emitPortfolioTelemetryEvent(detail: PortfolioTelemetryEventDetail): void {
  emitPortfolioTelemetryEventThroughBus(detail);
}

export function addPortfolioWindowEventListener<K extends PortfolioWindowEventName>(
  name: K,
  listener: (
    detail: PortfolioWindowEventDetailMap[K],
    event: CustomEvent<PortfolioWindowEventDetailMap[K]>,
  ) => void,
  options?: AddEventListenerOptions | boolean,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const eventListener: EventListener = (event) => {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const typedEvent = event as CustomEvent<PortfolioWindowEventDetailMap[K]>;
    listener(typedEvent.detail, typedEvent);
  };

  window.addEventListener(name, eventListener, options);
  return () => window.removeEventListener(name, eventListener, options);
}
