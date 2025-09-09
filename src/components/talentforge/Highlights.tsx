import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import { AccessTime, Psychology } from "@mui/icons-material";

const items = [
  {
    icon: <AccessTime />,
    title: "Efficiency and Time-Saving",
    description:
      "Bookworm dramatically reduces the time you spend reading and comprehending long PDF documents. By providing concise summaries, it allows you to grasp the key points quickly, freeing up time for other tasks or deeper study on specific areas of interest.",
  },
  {
    icon: <Psychology />,
    title: "Enhanced Understanding",
    description:
      "With the ability to ask specific questions about the PDF content, Bookworm enhances your understanding by clarifying complex information and providing detailed insights. This feature is particularly valuable for dense academic papers, technical manuals, and detailed reports where nuances matter.",
  },
  {
    icon: <AutoFixHighRoundedIcon />,
    title: "Accessibility and Convenience",
    description:
      "Bookworm is designed to be accessible anywhere and anytime. Whether you’re on the go or at your desk, you can easily upload documents and interact with your material without the need for extensive reading or manual searching through pages. This makes it an invaluable tool for students, professionals, and anyone who needs to process written content efficiently.",
  },
];

export default function Highlights() {
  return (
    <Box
      id="highlights"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        color: "white",
        bgcolor: "#06090a",
      }}
    >
      <Container
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 3, sm: 6 },
        }}
      >
        <Box
          sx={{
            width: { sm: "100%", md: "60%" },
            textAlign: { sm: "left", md: "center" },
          }}
        >
          <Typography component="h2" variant="h4">
            Highlights
          </Typography>
          <Typography variant="body1" sx={{ color: "grey.400" }}>
            <Typography
              variant="body1"
              component={"span"}
              color="text.contrastText"
              sx={{
                ml: 1,
                fontFamily: '"Gloria Hallelujah", cursive',
                fontWeight: 400,
                fontStyle: "normal",
              }}
            >
              bookworm
            </Typography>{" "}
            stands out with its advanced AI that not only summarizes PDFs but
            also answers content-specific questions, offering an intuitive,
            user-friendly interface that improves over time, making it an
            essential tool for efficient document handling and deeper
            comprehension.
          </Typography>
        </Box>
        <Grid container spacing={2.5}>
          {items.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Stack
                direction="column"
                color="inherit"
                component={Card}
                spacing={1}
                useFlexGap
                sx={{
                  p: 3,
                  height: "100%",
                  border: "1px solid",
                  borderColor: "grey.800",
                  background: "transparent",
                  backgroundColor: "grey.900",
                }}
              >
                <Box sx={{ opacity: "50%" }}>{item.icon}</Box>
                <div>
                  <Typography fontWeight="medium" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "grey.400" }}>
                    {item.description}
                  </Typography>
                </div>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
