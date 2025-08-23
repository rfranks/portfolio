import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { summary } from "@/consts/resumeData";

export default function ContactCTA() {
  return (
    <Paper sx={{ p: 2, mb: 4, textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        Contact
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          href={`mailto:${summary.contact.email}`}
        >
          Email
        </Button>
        <Button
          variant="outlined"
          href={summary.contact.linkedin}
          target="_blank"
          rel="noopener"
        >
          LinkedIn
        </Button>
      </Stack>
    </Paper>
  );
}
