import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import { education } from "@/consts/resumeData";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import FadeInSection from "@/components/shared/FadeInSection";
import { ListItemAvatar } from "@mui/material";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";

export default function Education() {
  return (
    <FadeInSection>
      <PortfolioPanel>
        <Typography variant="h6" gutterBottom className="mb-4">
          Education
        </Typography>
        <List className="space-y-2">
          {education.map((edu, index) => (
            <ListItem
              key={`${edu.school}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/5 transition-all duration-200 ease-out dark:bg-white/[0.03] hover:-translate-y-0.5 hover:bg-white/10 dark:hover:bg-white/[0.06]"
            >
              <ListItemAvatar>
                <Image
                  src={withBasePath(edu.image)}
                  alt={edu.school}
                  height={48}
                  width={48}
                />
              </ListItemAvatar>
              <ListItemText
                primary={edu.school}
                secondary={
                  <Box component="span" sx={{ display: "block" }}>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {edu.degree} • {edu.year}
                    </Typography>
                    {edu.awards && edu.awards.length > 0 && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}
                      >
                        Awards: {edu.awards.join(", ")}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </PortfolioPanel>
    </FadeInSection>
  );
}
