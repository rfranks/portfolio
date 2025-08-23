import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { education } from "@/consts/resumeData";

export default function Education() {
  return (
    <Paper sx={{ p: 2, mb: 4 }}>
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
    </Paper>
  );
}
