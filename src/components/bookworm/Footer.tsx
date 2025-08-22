import * as React from "react";
import Markdown from "react-markdown";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Close,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
} from "@mui/icons-material";

import TermsDialog from "./TermsDialog";

const logoStyle = {
  width: "140px",
  height: "auto",
};

const aboutUs = `
Bookworm is an innovative AI-powered tool designed to revolutionize the way we interact with PDF documents. Our mission is to empower users to efficiently handle and comprehend large volumes of textual content with ease.

## Our Vision

At Bookworm, we envision a future where accessing and understanding complex documents is effortless. By leveraging advanced artificial intelligence technologies, we aim to provide users with intelligent summaries, insightful analysis, and instant answers to content-specific questions.

## Our Mission

Our mission is to simplify the process of document handling and comprehension. We strive to save users time and effort by offering a user-friendly interface that allows for seamless interaction with PDF documents. Whether you're a student, professional, or researcher, Bookworm is your essential companion for unlocking the wealth of knowledge hidden within your documents.

## Key Features

- **Summarization**: Bookworm generates concise summaries of PDF documents, enabling users to grasp key points quickly.
- **Question-Answering**: With Bookworm's question-answering capability, users can ask specific questions about the content and receive instant answers.
- **Continuous Improvement**: Bookworm's AI algorithms continuously learn and improve over time, ensuring that users receive the most accurate and relevant information.
- **Accessibility**: Bookworm is accessible anywhere, anytime, allowing users to upload and interact with documents on the go.

## Meet the Team

Our team consists of passionate individuals dedicated to making document handling and comprehension more efficient and accessible. With expertise in artificial intelligence, natural language processing, and user experience design, we're committed to delivering an exceptional user experience with Bookworm.

## Contact Us

Have questions or feedback? We'd love to hear from you! Feel free to reach out to us at [richardfrankskr@hotmail.com](mailto:richardfranksjr@hotmail.com) and join us on our mission to revolutionize document handling and comprehension with Bookworm.
`;

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" mt={1}>
      {"Copyright © "}
      <Link href="https://github.com/rfranks/bookworm">
        <Typography
          variant="body2"
          component={"span"}
          sx={{
            fontFamily: '"Gloria Hallelujah", cursive',
            fontWeight: 400,
            fontStyle: "normal",
          }}
        >
          bookworm
        </Typography>
      </Link>{" "}
      {new Date().getFullYear()}
    </Typography>
  );
}

export default function Footer() {
  const [open, setOpen] = React.useState<"" | "terms" | "aboutUs">("");

  const scrollToSection = (sectionId: string) => {
    const sectionElement = document.getElementById(sectionId);
    const offset = 128;
    if (sectionElement) {
      const targetScroll = sectionElement.offsetTop - offset;
      sectionElement.scrollIntoView({ behavior: "smooth" });
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
      setOpen("");
    }
  };

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: { xs: 4, sm: 8 },
        py: { xs: 8, sm: 10 },
        textAlign: { sm: "center", md: "left" },
      }}
    >
      <TermsDialog open={open === "terms"} onClose={() => setOpen("")} />
      <Dialog open={open === "aboutUs"} onClose={() => setOpen("")}>
        <DialogTitle>About Us</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setOpen("")}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
        <DialogContent>
          <Markdown>{aboutUs}</Markdown>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen("")}>OK</Button>
        </DialogActions>
      </Dialog>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: { xs: "100%", sm: "60%" },
          }}
        >
          <Box sx={{ width: { xs: "100%", sm: "60%" } }}>
            <Box sx={{ ml: "-15px" }}>
              <img src="/logo192.png" style={logoStyle} alt="bookworm logo" />
            </Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Newsletter
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Subscribe to our newsletter for weekly updates and promotions.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap>
              <TextField
                id="outlined-basic"
                hiddenLabel
                size="small"
                variant="outlined"
                fullWidth
                aria-label="Enter your email address"
                placeholder="Your email address"
                inputProps={{
                  autocomplete: "off",
                  ariaLabel: "Enter your email address",
                }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ flexShrink: 0 }}
              >
                Subscribe
              </Button>
            </Stack>
          </Box>
        </Box>
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Link
            color="text.secondary"
            sx={{ cursor: "pointer" }}
            onClick={() => scrollToSection("highlights")}
          >
            Highlights
          </Link>
          <Link
            color="text.secondary"
            sx={{ cursor: "pointer" }}
            onClick={() => scrollToSection("pricing")}
          >
            Pricing
          </Link>
          <Link
            color="text.secondary"
            sx={{ cursor: "pointer" }}
            onClick={() => scrollToSection("faq")}
          >
            FAQs
          </Link>
        </Box>
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Company
          </Typography>
          <Link
            color="text.secondary"
            sx={{ cursor: "pointer" }}
            onClick={() => setOpen("aboutUs")}
          >
            About us
          </Link>
          <Link color="text.secondary" href="#">
            Careers
          </Link>
          <Link color="text.secondary" href="#">
            Press
          </Link>
        </Box>
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Legal
          </Typography>
          <Link
            color="text.secondary"
            sx={{ cursor: "pointer" }}
            onClick={() => setOpen("terms")}
          >
            Terms
          </Link>
          <Link color="text.secondary" href="#">
            Privacy
          </Link>
          <Link color="text.secondary" href="#">
            Contact
          </Link>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pt: { xs: 4, sm: 8 },
          width: "100%",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <div>
          <Link color="text.secondary" href="#">
            Privacy Policy
          </Link>
          <Typography display="inline" sx={{ mx: 0.5, opacity: 0.5 }}>
            &nbsp;•&nbsp;
          </Typography>
          <Link
            color="text.secondary"
            sx={{ cursor: "pointer" }}
            onClick={() => setOpen("terms")}
          >
            Terms of Service
          </Link>
          <Copyright />
        </div>
        <Stack
          direction="row"
          justifyContent="left"
          spacing={1}
          useFlexGap
          sx={{
            color: "text.secondary",
          }}
        >
          <IconButton
            color="inherit"
            href="https://github.com/rfranks/bookworm"
            aria-label="GitHub"
            sx={{ alignSelf: "center" }}
          >
            <GitHubIcon />
          </IconButton>
          <IconButton
            color="inherit"
            href="https://www.linkedin.com/in/richardfranksjr/"
            aria-label="LinkedIn"
            sx={{ alignSelf: "center" }}
          >
            <LinkedInIcon />
          </IconButton>
        </Stack>
      </Box>
    </Container>
  );
}
