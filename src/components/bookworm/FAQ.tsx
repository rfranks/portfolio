import * as React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function FAQ() {
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Container
      id="faq"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Typography
        component="h2"
        variant="h4"
        color="text.primary"
        sx={{
          width: { sm: "100%", md: "60%" },
          textAlign: { sm: "left", md: "center" },
        }}
      >
        Frequently asked questions
      </Typography>
      <Box sx={{ width: "100%" }}>
        <Accordion
          expanded={expanded === "panel1"}
          onChange={handleChange("panel1")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1d-content"
            id="panel1d-header"
          >
            <Typography component="h3" variant="subtitle2">
              What is{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>
              {"?"}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Bookworm is an advanced AI-powered tool designed to summarize PDF
              documents and answer content-specific questions. It offers a
              user-friendly interface and continuously improves over time to
              provide efficient document handling and deeper comprehension.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel2"}
          onChange={handleChange("panel2")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2d-content"
            id="panel2d-header"
          >
            <Typography component="h3" variant="subtitle2">
              How does{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              save time?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Bookworm dramatically reduces the time spent reading and
              comprehending long PDF documents by providing concise summaries.
              This allows users to quickly grasp key points, freeing up time for
              other tasks or deeper study on specific areas of interest.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel3"}
          onChange={handleChange("panel3")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3d-content"
            id="panel3d-header"
          >
            <Typography component="h3" variant="subtitle2">
              How does{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              enhance understanding?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Bookworm enhances understanding by allowing users to ask specific
              questions about the PDF content. It clarifies complex information
              and provides detailed insights, which is particularly valuable for
              dense academic papers, technical manuals, and detailed reports
              where nuances matter.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel4"}
          onChange={handleChange("panel4")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4d-content"
            id="panel4d-header"
          >
            <Typography component="h3" variant="subtitle2">
              Is{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              accessible anywhere?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Yes, Bookworm is designed to be accessible anywhere and anytime.
              Whether you're on the go or at your desk, you can easily upload
              documents and interact with your material without the need for
              extensive reading or manual searching through pages.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel5"}
          onChange={handleChange("panel5")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel5d-content"
            id="panel5d-header"
          >
            <Typography component="h3" variant="subtitle2">
              Who can benefit from using{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>
              ?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Bookworm is beneficial for students, professionals, and anyone who
              deals with large volumes of PDF documents. It helps streamline
              document handling, improve comprehension, and save time, making it
              an invaluable tool for various tasks and industries.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel6"}
          onChange={handleChange("panel6")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel6d-content"
            id="panel6d-header"
          >
            <Typography component="h3" variant="subtitle2">
              Can{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              handle different types of PDF documents?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Yes, Bookworm is versatile and can handle various types of PDF
              documents, including academic papers, technical manuals, reports,
              and more. Its advanced AI capabilities adapt to different content
              structures and complexities to provide accurate summaries and
              insights.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel7"}
          onChange={handleChange("panel7")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel7d-content"
            id="panel7d-header"
          >
            <Typography component="h3" variant="subtitle2">
              Is{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              easy to use?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Yes, Bookworm offers an intuitive, user-friendly interface that is
              easy to navigate. Its features are designed to be accessible and
              straightforward, allowing users to upload documents, ask
              questions, and interact with the content seamlessly.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel8"}
          onChange={handleChange("panel8")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel8d-content"
            id="panel8d-header"
          >
            <Typography component="h3" variant="subtitle2">
              Does{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              require any installation?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              No, Bookworm is a web-based application that does not require any
              installation. Users can access it directly through their web
              browsers, making it convenient to use on any device with an
              internet connection.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel9"}
          onChange={handleChange("panel9")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel9d-content"
            id="panel9d-header"
          >
            <Typography component="h3" variant="subtitle2">
              Is{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              secure?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Yes, Bookworm takes user privacy and data security seriously. It
              uses encryption and other security measures to protect user data
              and ensure confidentiality while handling PDF documents.
              Additionally, Bookworm does not store uploaded documents after
              processing.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel10"}
          onChange={handleChange("panel10")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel10d-content"
            id="panel10d-header"
          >
            <Typography component="h3" variant="subtitle2">
              Can{" "}
              <Typography
                variant="subtitle2"
                component={"span"}
                sx={{
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                bookworm
              </Typography>{" "}
              be used for collaborative work?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ maxWidth: { sm: "100%", md: "70%" } }}
            >
              Currently, Bookworm is primarily designed for individual use.
              However, future updates may include collaborative features to
              facilitate teamwork and document sharing among users.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
}
