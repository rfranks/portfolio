"use client";

import Box from "@mui/material/Box";
import CoreCompetencies, {
  type CompetencyCategory,
} from "@/components/portfolio/panels/CoreCompetencies";

type TechnologiesSectionProps = {
  menuIdPrefix: string;
  categories: CompetencyCategory[];
};

export default function TechnologiesSection({
  menuIdPrefix,
  categories,
}: TechnologiesSectionProps) {
  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CoreCompetencies
        embedded
        categoriesOverride={categories}
        menuIdPrefix={`${menuIdPrefix}-technologies`}
      />
    </Box>
  );
}
