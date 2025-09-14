"use client";

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { getOffers, type Offer } from "@/utils/talentforge/dataStore";
import { exportElementToPdf } from "@/utils/pdfExport";
import EmptyState from "../EmptyState";

interface OfferListProps {
  refreshKey?: number;
}

export default function OfferList({ refreshKey }: OfferListProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const markdownRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setOffers(getOffers());
  }, [refreshKey]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedOffers = offers.filter((o) => selected.has(o.id));

  const getComp = (offer: Offer, type: string) => {
    return offer.compensation.find((c) => c.type === type)?.amount || 0;
  };

  const exportMarkdown = () => {
    const headers = ["Component", ...selectedOffers.map((_, i) => `Offer ${i + 1}`)];
    const comps = ["salary", "bonus", "equity"] as const;
    const rows = comps.map((c) => [
      c.charAt(0).toUpperCase() + c.slice(1),
      ...selectedOffers.map((o) => getComp(o, c)),
    ]);
    const markdown = [
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => "---").join(" | ")} |`,
      ...rows.map((r) => `| ${r.join(" | ")} |`),
    ].join("\n");
    if (markdownRef.current) {
      markdownRef.current.innerText = markdown;
      exportElementToPdf(markdownRef.current, "offer-comparison.md");
    }
  };

  return (
    <Box>
      {offers.length === 0 ? (
        <EmptyState
          imgSrc="/images/empty-state.svg"
          alt="No offers illustration"
          message="No offers"
          helperText="Add job offers to compare compensation."
        />
      ) : (
        <List aria-label="offers list">
          {offers.map((offer, index) => (
            <ListItem
              key={offer.id}
              button
              onClick={() => toggleSelect(offer.id)}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selected.has(offer.id)}
                  inputProps={{ "aria-label": `select offer ${index + 1}` }}
                />
              </ListItemIcon>
              <ListItemText
                primary={`Offer ${index + 1}`}
                secondary={
                  offer.summary ||
                  offer.compensation
                    .map((c) => `${c.type}: ${c.amount}`)
                    .join(", ")
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      {selectedOffers.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  {selectedOffers.map((_, i) => (
                    <TableCell key={i}>{`Offer ${i + 1}`}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(["salary", "bonus", "equity"] as const).map((c) => (
                  <TableRow key={c}>
                    <TableCell>{c.charAt(0).toUpperCase() + c.slice(1)}</TableCell>
                    {selectedOffers.map((o) => (
                      <TableCell key={o.id}>{getComp(o, c)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" onClick={exportMarkdown}>
            Export to Markdown
          </Button>
          <pre ref={markdownRef} style={{ display: "none" }} />
        </Box>
      )}
    </Box>
  );
}

