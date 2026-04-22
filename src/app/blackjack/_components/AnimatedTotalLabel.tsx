"use client";

import * as React from "react";

type AnimatedTotalLabelProps = {
  value: string;
  className?: string;
};

const CHANGE_ANIMATION_MS = 320;

export default function AnimatedTotalLabel({ value, className }: AnimatedTotalLabelProps) {
  const [currentValue, setCurrentValue] = React.useState(value);
  const [outgoingValue, setOutgoingValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (value === currentValue) {
      return;
    }

    setOutgoingValue(currentValue);
    setCurrentValue(value);

    const timeoutId = window.setTimeout(() => {
      setOutgoingValue(null);
    }, CHANGE_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentValue, value]);

  return (
    <span className={`blackjack-animated-total${className ? ` ${className}` : ""}`}>
      {outgoingValue ? (
        <span className="blackjack-animated-total-value blackjack-animated-total-value--outgoing">
          {outgoingValue}
        </span>
      ) : null}
      <span
        key={currentValue}
        className="blackjack-animated-total-value blackjack-animated-total-value--incoming"
      >
        {currentValue}
      </span>
    </span>
  );
}
