import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { summary } from "@/consts/resumeData";
import TronPaper from "@/components/app/TronPaper";

export default function ContactCTA() {
  return (
    <TronPaper sx={{ textAlign: "center" }}>
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
          color="secondary"
        >
          LinkedIn
        </Button>
      </Stack>
    </TronPaper>
  );
}
