import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { contactCTA, summary } from "@/personal/data/resumeData";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";

export default function ContactCTA() {
  return (
    <FadeInSection>
      <TronPaper className="text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <Typography variant="h6" gutterBottom>
            {contactCTA.title}
          </Typography>
          <Typography color="text.secondary" className="leading-7">
            {contactCTA.body}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" useFlexGap flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              href={`mailto:${summary.contact.email}`}
              className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              {contactCTA.primaryLabel}
            </Button>
            <Button
              variant="outlined"
              href={summary.contact.linkedin}
              target="_blank"
              rel="noopener"
              color="secondary"
              className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              {contactCTA.secondaryLabel}
            </Button>
          </Stack>
        </div>
      </TronPaper>
    </FadeInSection>
  );
}
