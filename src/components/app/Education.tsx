import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { education } from "@/consts/resumeData";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import { ListItemAvatar } from "@mui/material";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";

export default function Education() {
  return (
    <FadeInSection>
      <TronPaper>
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
                secondary={`${edu.degree} • ${edu.year}`}
              />
            </ListItem>
          ))}
        </List>
      </TronPaper>
    </FadeInSection>
  );
}
