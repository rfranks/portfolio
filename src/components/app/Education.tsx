import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { education } from "@/consts/resumeData";
import Section from "./Section";

export default function Education() {
    return (
      <Section>
        <Typography variant="h6" gutterBottom>
          Education
        </Typography>
        <List>
          {education.map((edu, index) => (
            <ListItem key={`${edu.school}-${index}`}>
              <ListItemText primary={edu.school} secondary={edu.degree} />
            </ListItem>
          ))}
        </List>
      </Section>
    );
  }
