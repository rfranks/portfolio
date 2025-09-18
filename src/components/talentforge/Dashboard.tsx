"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography, Skeleton } from "@mui/material";
import { useTalentForgeSelector } from "@/contexts/TalentForgeDataContext";

export default function Dashboard() {
  const resumes = useTalentForgeSelector(
    (store) => store.getResumes(),
    { keys: ["resumes"] },
  );
  const applications = useTalentForgeSelector(
    (store) => store.getJobApplications(),
    { keys: ["applications"] },
  );
  const offers = useTalentForgeSelector(
    (store) => store.getOffers(),
    { keys: ["offers"] },
  );
  const messages = useTalentForgeSelector(
    (store) => store.getMessages(),
    { keys: ["messages"] },
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [resumes, applications, offers, messages]);

  const items = [
    { label: "Resumes", value: resumes.length },
    { label: "Applications", value: applications.length },
    { label: "Offers", value: offers.length },
    { label: "Messages", value: messages.length },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Grid key={idx} item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Skeleton width="60%" />
                    <Skeleton height={40} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : items.map((item) => (
              <Grid key={item.label} item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      {item.label}
                    </Typography>
                    <Typography variant="h4">{item.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}

