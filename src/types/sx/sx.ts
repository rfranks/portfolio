import type { SxProps, Theme } from "@mui/material/styles";

export type FlatSx = Exclude<SxProps<Theme>, readonly unknown[] | false | null | undefined>;
export type FlatSxArray = FlatSx[];
