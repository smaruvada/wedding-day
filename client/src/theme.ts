import { createTheme } from "@mantine/core";

export const weddingTheme = createTheme({
  primaryColor: "rose",
  primaryShade: 6,
  defaultRadius: "md",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  headings: {
    fontFamily: "Georgia, Times New Roman, serif",
    fontWeight: "600",
  },
  colors: {
    rose: [
      "#fff7f5", "#fceae6", "#f5d7d1", "#edc1b9", "#e7ada3",
      "#df978d", "#c87870", "#a85c57", "#87433f", "#6d3432",
    ],
    sage: [
      "#f3f7f1", "#e4ede1", "#ceddc9", "#b5cbb0", "#9cb99a",
      "#85a784", "#6a8b68", "#526e53", "#3d5740", "#2d4532",
    ],
  },
});
