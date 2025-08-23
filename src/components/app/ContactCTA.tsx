import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { summary } from "@/consts/resumeData";
import Section from "./Section";

export default function ContactCTA() {
    return (
      <Section sx={{ textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Contact
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            href={`mailto:${summary.contact.email}`}
            sx={{ boxShadow: (theme) => `0 0 10px ${theme.palette.primary.main}` }}
          >
            Email
          </Button>
          <Button
            variant="outlined"
            href={summary.contact.linkedin}
            target="_blank"
            rel="noopener"
            sx={{ borderColor: "primary.main" }}
          >
            LinkedIn
          </Button>
        </Stack>
      </Section>
    );
  }
