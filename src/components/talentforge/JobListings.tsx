"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { v4 as uuid } from "uuid";
import type { JobListing } from "@/types";
import jobAggregator from "@/utils/talentforge/jobAggregator";
import { addJobApplication } from "@/utils/talentforge/dataStore";
import Chip from "@/components/fabric/Chip";

export default function JobListings() {
  const [listings, setListings] = useState<JobListing[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    jobAggregator.fetchAllListings("").then((results) => {
      setListings(results);
    });
  }, []);

  const handleSave = (listing: JobListing) => {
    addJobApplication({
      id: uuid(),
      applicant: { id: "", name: "", email: "" },
      role: { ...listing, id: uuid() },
      status: "applied",
      history: [
        { status: "applied", changedAt: new Date().toISOString() },
      ],
    });
    setSaved((prev) => new Set(prev).add(listing.url));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Job Listings
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="job listings">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Source</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.url}>
                <TableCell>
                  <Link
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    {listing.title}
                  </Link>
                </TableCell>
                <TableCell>{listing.company}</TableCell>
                <TableCell>{listing.location}</TableCell>
                <TableCell>
                  <Chip label={listing.source} size="small" color="primary" />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleSave(listing)}
                    disabled={saved.has(listing.url)}
                  >
                    Save application
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
