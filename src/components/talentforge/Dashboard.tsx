"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography, Skeleton } from "@mui/material";
import { useTalentForgeSelector } from "@/contexts/TalentForgeDataContext";

export default function Dashboard() {
  const resumeCount = useTalentForgeSelector(
    (store) => store.getResumes().length,
  );
  const applicationCount = useTalentForgeSelector(
    (store) => store.getJobApplications().length,
  );
  const offerCount = useTalentForgeSelector(
    (store) => store.getOffers().length,
  );
  const messageCount = useTalentForgeSelector(
    (store) => store.getMessages().length,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [resumeCount, applicationCount, offerCount, messageCount]);

  const items = [
    { label: "Resumes", value: resumeCount },
    { label: "Applications", value: applicationCount },
    { label: "Offers", value: offerCount },
    { label: "Messages", value: messageCount },
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

