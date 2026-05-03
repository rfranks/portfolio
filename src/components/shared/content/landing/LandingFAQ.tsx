"use client";

import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type FAQItem = {
  id: string;
  questionPrefix: string;
  questionSuffix: string;
  answer: (appName: string) => string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "panel1",
    questionPrefix: "What is",
    questionSuffix: "?",
    answer: (appName) =>
      `${appName} is an advanced AI-powered tool designed to summarize PDF documents and answer content-specific questions. It offers a user-friendly interface and continuously improves over time to provide efficient document handling and deeper comprehension.`,
  },
  {
    id: "panel2",
    questionPrefix: "How does",
    questionSuffix: "save time?",
    answer: (appName) =>
      `${appName} dramatically reduces the time spent reading and comprehending long PDF documents by providing concise summaries. This allows users to quickly grasp key points, freeing up time for other tasks or deeper study on specific areas of interest.`,
  },
  {
    id: "panel3",
    questionPrefix: "How does",
    questionSuffix: "enhance understanding?",
    answer: (appName) =>
      `${appName} enhances understanding by allowing users to ask specific questions about the PDF content. It clarifies complex information and provides detailed insights, which is particularly valuable for dense academic papers, technical manuals, and detailed reports where nuances matter.`,
  },
  {
    id: "panel4",
    questionPrefix: "Is",
    questionSuffix: "accessible anywhere?",
    answer: (appName) =>
      `Yes, ${appName} is designed to be accessible anywhere and anytime. Whether you're on the go or at your desk, you can easily upload documents and interact with your material without the need for extensive reading or manual searching through pages.`,
  },
  {
    id: "panel5",
    questionPrefix: "Who can benefit from using",
    questionSuffix: "?",
    answer: (appName) =>
      `${appName} is beneficial for students, professionals, and anyone who deals with large volumes of PDF documents. It helps streamline document handling, improve comprehension, and save time, making it an invaluable tool for various tasks and industries.`,
  },
  {
    id: "panel6",
    questionPrefix: "Can",
    questionSuffix: "handle different types of PDF documents?",
    answer: (appName) =>
      `Yes, ${appName} is versatile and can handle various types of PDF documents, including academic papers, technical manuals, reports, and more. Its advanced AI capabilities adapt to different content structures and complexities to provide accurate summaries and insights.`,
  },
  {
    id: "panel7",
    questionPrefix: "Is",
    questionSuffix: "easy to use?",
    answer: (appName) =>
      `Yes, ${appName} offers an intuitive, user-friendly interface that is easy to navigate. Its features are designed to be accessible and straightforward, allowing users to upload documents, ask questions, and interact with the content seamlessly.`,
  },
  {
    id: "panel8",
    questionPrefix: "Does",
    questionSuffix: "require any installation?",
    answer: (appName) =>
      `No, ${appName} is a web-based application that does not require any installation. Users can access it directly through their web browsers, making it convenient to use on any device with an internet connection.`,
  },
  {
    id: "panel9",
    questionPrefix: "Is",
    questionSuffix: "secure?",
    answer: (appName) =>
      `Yes, ${appName} takes user privacy and data security seriously. It uses encryption and other security measures to protect user data and ensure confidentiality while handling PDF documents. Additionally, ${appName} does not store uploaded documents after processing.`,
  },
  {
    id: "panel10",
    questionPrefix: "Can",
    questionSuffix: "be used for collaborative work?",
    answer: (appName) =>
      `Currently, ${appName} is primarily designed for individual use. However, future updates may include collaborative features to facilitate teamwork and document sharing among users.`,
  },
];

export interface LandingFAQProps {
  appName: string;
  appWordmark: string;
}

export default function LandingFAQ({ appName, appWordmark }: LandingFAQProps) {
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
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
        {FAQ_ITEMS.map((item) => (
          <Accordion key={item.id} expanded={expanded === item.id} onChange={handleChange(item.id)}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${item.id}-content`}
              id={`${item.id}-header`}
            >
              <Typography component="h3" variant="subtitle2">
                {item.questionPrefix}{" "}
                <Typography
                  variant="subtitle2"
                  component="span"
                  sx={{
                    fontFamily: '"Gloria Hallelujah", cursive',
                    fontWeight: 400,
                    fontStyle: "normal",
                  }}
                >
                  {appWordmark}
                </Typography>{" "}
                {item.questionSuffix}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom sx={{ maxWidth: { sm: "100%", md: "70%" } }}>
                {item.answer(appName)}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}
