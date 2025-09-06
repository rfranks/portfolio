import Image from "next/image";
import { Card, CardActions, CardContent, Button, Typography, Box, Link } from "@mui/material";
import { withBasePath } from "@/utils/basePath";

export interface Accolade {
  name: string;
  source: string;
  sourceUrl: string;
  description?: string;
  comment?: string;
  launchUrl?: string;
  githubUrl?: string;
  imageSrcUrl?: string;
  date?: string;
}

export default function AccoladesCarousel({ accolades }: { accolades: Accolade[] }) {
  return (
    <Box
      sx={{
        display: "flex",
        overflowX: "auto",
        gap: 2,
        py: 1,
        scrollSnapType: "x mandatory",
      }}
    >
      {accolades.map((acc, idx) => (
        <Card
          key={idx}
          variant="outlined"
          sx={{ minWidth: 280, flex: "0 0 auto", scrollSnapAlign: "start" }}
        >
          {acc.imageSrcUrl && (
            <Image
              src={withBasePath(acc.imageSrcUrl)}
              alt={acc.name}
              width={300}
              height={200}
              style={{ width: "100%", height: "auto" }}
            />
          )}
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {acc.name}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              <Link
                href={acc.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                {acc.source}
              </Link>
            </Typography>
            {acc.date && (
              <Typography variant="caption" color="text.secondary" display="block">
                {acc.date}
              </Typography>
            )}
            {acc.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {acc.description}
              </Typography>
            )}
            {acc.comment && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                {acc.comment}
              </Typography>
            )}
          </CardContent>
          {(acc.launchUrl || acc.githubUrl) && (
            <CardActions>
              {acc.launchUrl && (
                <Button
                  size="small"
                  href={withBasePath(acc.launchUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Launch
                </Button>
              )}
              {acc.githubUrl && (
                <Button
                  size="small"
                  href={acc.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </Button>
              )}
            </CardActions>
          )}
        </Card>
      ))}
    </Box>
  );
}

