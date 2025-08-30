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
        <Typography variant="h6" gutterBottom>
          Education
        </Typography>
        <List>
          {education.map((edu, index) => (
            <ListItem key={`${edu.school}-${index}`}>
              <ListItemAvatar>
                <Image
                  src={withBasePath(edu.image)}
                  alt={edu.school}
                  height={48}
                  width={48}
                />
              </ListItemAvatar>
              <ListItemText primary={edu.school} secondary={edu.degree} />
            </ListItem>
          ))}
        </List>
      </TronPaper>
    </FadeInSection>
  );
}
