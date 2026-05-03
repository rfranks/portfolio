export type LandingHighlightsTone = "adaptive" | "dark";

export interface LandingBranding {
  appName: string;
  appWordmark: string;
  logoSrc: string;
  logoAlt: string;
  githubUrl: string;
  linkedInUrl?: string;
  contactEmail?: string;
}
