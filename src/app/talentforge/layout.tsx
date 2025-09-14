'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { ThemeProvider } from '@mui/material/styles';
import talentforgeTheme from '@/themes/talentforgeTheme';

export default function TalentForgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: 'Dashboard', href: '/talentforge' },
    { label: 'Applications', href: '/talentforge/applications' },
    { label: 'Resumes', href: '/talentforge/resumes' },
    { label: 'Offers', href: '/talentforge/offers' },
    { label: 'Inbox', href: '/talentforge/inbox' },
    { label: 'Settings', href: '/talentforge/settings' },
  ];

  return (
    <ThemeProvider theme={talentforgeTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Box component="nav" sx={{ width: 240, flexShrink: 0 }}>
          <List>
            {navItems.map(({ label, href }) => (
              <ListItem key={label} disablePadding>
                <ListItemButton component={Link} href={href}>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
