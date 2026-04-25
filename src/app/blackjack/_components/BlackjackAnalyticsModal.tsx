"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Box } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BlackjackAnalyticsRound } from "../_types/page";

type BlackjackAnalyticsModalProps = {
  closing: boolean;
  onClose: () => void;
  onModalOk: () => void;
  open: boolean;
  rounds: BlackjackAnalyticsRound[];
};

export default function BlackjackAnalyticsModal({
  closing,
  onClose,
  onModalOk,
  open,
  rounds,
}: BlackjackAnalyticsModalProps) {
  const outcomeData = React.useMemo(() => {
    const base = {
      win: 0,
      loss: 0,
      push: 0,
    };
    for (const round of rounds) {
      base[round.outcome] += 1;
    }
    return [
      { name: "Wins", value: base.win },
      { name: "Losses", value: base.loss },
      { name: "Pushes", value: base.push },
    ];
  }, [rounds]);

  const trendData = React.useMemo(() => {
    let runningNet = 0;
    return rounds.map((round) => {
      runningNet += round.netDelta;
      return {
        round: round.round,
        net: runningNet,
        delta: round.netDelta,
      };
    });
  }, [rounds]);

  const bustData = React.useMemo(
    () =>
      rounds.map((round) => ({
        bustedHands: round.bustedHands,
        dealerBusted: round.dealerBusted ? 1 : 0,
        round: round.round,
      })),
    [rounds],
  );

  const summary = React.useMemo(() => {
    const blackjackWins = rounds.filter((round) => round.blackjackWin).length;
    const totalBustedHands = rounds.reduce((count, round) => count + round.bustedHands, 0);
    const dealerBustRounds = rounds.filter((round) => round.dealerBusted).length;
    const netTotal = rounds.reduce((sum, round) => sum + round.netDelta, 0);
    return {
      blackjackWins,
      dealerBustRounds,
      netTotal,
      totalBustedHands,
    };
  }, [rounds]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`blackjack-round-end-modal blackjack-hint-modal${closing ? " blackjack-round-end-modal--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blackjack-analytics-modal-title"
    >
      <button
        type="button"
        className="blackjack-round-end-modal__backdrop"
        aria-label="Close analytics"
        onClick={onClose}
      />
      <div className="blackjack-round-end-modal__panel blackjack-hint-modal__panel blackjack-round-details-modal__panel">
        <h3 id="blackjack-analytics-modal-title" className="blackjack-hint-modal__title">
          Session Analytics
        </h3>
        <Box sx={{ display: "grid", gap: 1.2 }}>
          <Box
            sx={{
              display: "grid",
              gap: 0.5,
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            }}
          >
            <Box sx={analyticsChipSx}>Rounds: {rounds.length}</Box>
            <Box sx={analyticsChipSx}>Total busts: {summary.totalBustedHands}</Box>
            <Box sx={analyticsChipSx}>Dealer bust rounds: {summary.dealerBustRounds}</Box>
            <Box sx={analyticsChipSx}>Blackjack wins: {summary.blackjackWins}</Box>
          </Box>
          <Box sx={analyticsChipSx}>
            Net: {summary.netTotal >= 0 ? "+" : "-"}${Math.abs(summary.netTotal).toLocaleString()}
          </Box>
        </Box>
        <div className="blackjack-round-details-modal__timeline-wrap">
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "grid",
              gap: 1.1,
              pr: 0.25,
            }}
          >
            {rounds.length ? (
              <>
                <Box sx={chartCardSx}>
                  <Box sx={chartTitleSx}>Outcomes by round result</Box>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={outcomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="name" stroke="rgba(203,213,225,0.9)" />
                      <YAxis allowDecimals={false} stroke="rgba(203,213,225,0.9)" />
                      <Tooltip
                        contentStyle={tooltipSx}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value: number) => [`${value}`, "Rounds"]}
                      />
                      <Bar dataKey="value" fill="rgba(56,189,248,0.92)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={chartCardSx}>
                  <Box sx={chartTitleSx}>Cumulative net by round</Box>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="round" stroke="rgba(203,213,225,0.9)" />
                      <YAxis stroke="rgba(203,213,225,0.9)" />
                      <Tooltip
                        contentStyle={tooltipSx}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value: number, key) => [
                          `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString()}`,
                          key === "net" ? "Cumulative net" : "Round delta",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        stroke="rgba(74,222,128,0.96)"
                        strokeWidth={2.4}
                        dot={{ r: 2.2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={chartCardSx}>
                  <Box sx={chartTitleSx}>Bust pressure by round</Box>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={bustData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="round" stroke="rgba(203,213,225,0.9)" />
                      <YAxis allowDecimals={false} stroke="rgba(203,213,225,0.9)" />
                      <Tooltip contentStyle={tooltipSx} labelStyle={{ color: "#f8fafc" }} />
                      <Bar
                        dataKey="bustedHands"
                        name="Player busted hands"
                        fill="rgba(251,113,133,0.94)"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="dealerBusted"
                        name="Dealer busted"
                        fill="rgba(253,224,71,0.92)"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </>
            ) : (
              <Box sx={emptyStateSx}>
                Play at least one full round to generate analytics for outcomes, bust pressure, and
                cumulative net.
              </Box>
            )}
          </Box>
        </div>
        <div className="blackjack-hint-modal__actions">
          <button
            type="button"
            className="blackjack-button blackjack-button-subtle"
            onClick={() => {
              onModalOk();
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const analyticsChipSx = {
  border: "1px solid rgba(148, 163, 184, 0.34)",
  borderRadius: "10px",
  padding: "0.35rem 0.48rem",
  color: "rgba(226, 232, 240, 0.95)",
  background: "rgba(15, 23, 42, 0.46)",
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: 1.25,
};

const chartCardSx = {
  border: "1px solid rgba(148, 163, 184, 0.32)",
  borderRadius: "12px",
  background: "rgba(15, 23, 42, 0.5)",
  padding: "0.5rem 0.55rem",
};

const chartTitleSx = {
  color: "rgba(226, 232, 240, 0.96)",
  fontSize: "0.76rem",
  fontWeight: 800,
  letterSpacing: "0.03em",
  marginBottom: "0.35rem",
  textTransform: "uppercase",
};

const tooltipSx = {
  background: "rgba(2, 6, 23, 0.9)",
  border: "1px solid rgba(148, 163, 184, 0.44)",
  borderRadius: "8px",
  color: "#f8fafc",
};

const emptyStateSx = {
  border: "1px dashed rgba(148, 163, 184, 0.45)",
  borderRadius: "12px",
  background: "rgba(15, 23, 42, 0.4)",
  color: "rgba(226, 232, 240, 0.93)",
  fontSize: "0.8rem",
  lineHeight: 1.5,
  padding: "0.7rem 0.75rem",
};
