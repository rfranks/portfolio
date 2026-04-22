"use client";

import * as React from "react";
import { BLACKJACK_CAROUSEL_SLIDES } from "../_consts/blackjack";

type BlackjackCarouselNavProps = {
  activeSlideIndex: number;
  onCycleSlides: (direction: -1 | 1) => void;
  onSelectSlide: (index: number) => void;
};

export default function BlackjackCarouselNav({
  activeSlideIndex,
  onCycleSlides,
  onSelectSlide,
}: BlackjackCarouselNavProps) {
  return (
    <nav className="blackjack-carousel-nav" aria-label="Blackjack page sections">
      <button
        type="button"
        className="blackjack-carousel-arrow"
        aria-label="Previous section"
        onClick={() => onCycleSlides(-1)}
      >
        ←
      </button>
      <div className="blackjack-carousel-dots" role="tablist" aria-label="Slides">
        {BLACKJACK_CAROUSEL_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={activeSlideIndex === index}
            aria-label={`Go to ${slide.label} section`}
            className={`blackjack-carousel-dot${activeSlideIndex === index ? " blackjack-carousel-dot--active" : ""}`}
            onClick={() => onSelectSlide(index)}
          />
        ))}
      </div>
      <button
        type="button"
        className="blackjack-carousel-arrow"
        aria-label="Next section"
        onClick={() => onCycleSlides(1)}
      >
        →
      </button>
    </nav>
  );
}
