"use client";

import * as React from "react";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";

export type ChipDecoratedValueProps = {
  chipSrc: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  valueClassName?: string;
};

const ChipDecoratedValue = React.forwardRef<HTMLSpanElement, ChipDecoratedValueProps>(
  function ChipDecoratedValue({ chipSrc, children, className, id, valueClassName }, ref) {
    return (
      <span ref={ref} id={id} className={className}>
        <Image
          className="blackjack-chip-adornment"
          src={withBasePath(chipSrc)}
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
        />
        <span className={valueClassName}>{children}</span>
      </span>
    );
  },
);

export default ChipDecoratedValue;
