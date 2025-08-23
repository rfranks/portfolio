"use client";

import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import {
  Menu,
  ChevronLeft,
  Home as HomeIcon,
  Science,
  MenuBook,
  Casino,
  Flight,
  BugReport,
} from "@mui/icons-material";
import AppBar from "@/components/app/AppBar";
import Drawer from "@/components/app/Drawer";
import ResumeHero from "@/components/app/ResumeHero";
import ResumeSummary from "@/components/app/ResumeSummary";
import CoreCompetencies from "@/components/app/CoreCompetencies";
import ExperienceTimeline from "@/components/app/ExperienceTimeline";
import ProjectsGrid from "@/components/app/ProjectsGrid";
import Education from "@/components/app/Education";
import Recognition from "@/components/app/Recognition";
import ContactCTA from "@/components/app/ContactCTA";

export default function Home() {
  const defaultTheme = createTheme();
  const [open, setOpen] = useState(false);
  const drawerWidth = 240;

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        <AppBar position="absolute" open={open} drawerWidth={drawerWidth}>
          <Toolbar sx={{ pr: "24px" }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{ marginRight: "36px", ...(open && { display: "none" }) }}
            >
              <Menu />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Portfolio
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open} drawerWidth={drawerWidth}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeft />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            <ListItemButton component="a" href="/">
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
            <ListItemButton component="a" href="/dna">
              <ListItemIcon>
                <Science />
              </ListItemIcon>
              <ListItemText primary="GeneBoard" />
            </ListItemButton>
            <ListItemButton component="a" href="/bookworm">
              <ListItemIcon>
                <MenuBook />
              </ListItemIcon>
              <ListItemText primary="Bookworm" />
            </ListItemButton>
            <ListItemButton component="a" href="/blackjack">
              <ListItemIcon>
                <Casino />
              </ListItemIcon>
              <ListItemText primary="Blackjack" />
            </ListItemButton>
            <ListItemButton component="a" href="/warbirds">
              <ListItemIcon>
                <Flight />
              </ListItemIcon>
              <ListItemText primary="Warbirds" />
            </ListItemButton>
            <ListItemButton component="a" href="/zombiefish">
              <ListItemIcon>
                <BugReport />
              </ListItemIcon>
              <ListItemText primary="ZombieFish" />
            </ListItemButton>
          </List>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Toolbar />
          <Container>
            <ResumeHero />
            <ResumeSummary />
            <CoreCompetencies />
            <ExperienceTimeline />
            <ProjectsGrid />
            <Education />
            <Recognition />
            <ContactCTA />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
