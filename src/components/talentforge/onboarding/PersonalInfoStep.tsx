"use client";

import { useMemo, useState } from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { v4 as uuid } from "uuid";

import type { UserProfile } from "@/utils/talentforge/dataStore";
import { getUserProfile, saveUserProfile } from "@/utils/talentforge/dataStore";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

const deriveNameParts = (profile: UserProfile | undefined) => {
  const first = profile?.firstName?.trim();
  const last = profile?.lastName?.trim();
  if (first || last) {
    return {
      firstName: first ?? "",
      lastName: last ?? "",
    };
  }
  const parts = profile?.name?.trim().split(/\s+/) ?? [];
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  const [derivedFirst, ...rest] = parts;
  return {
    firstName: derivedFirst ?? "",
    lastName: rest.join(" ") ?? "",
  };
};

export default function PersonalInfoStep({ onNext, onBack }: StepProps) {
  const initialProfile = useMemo(() => getUserProfile(), []);
  const [profileId] = useState(() => initialProfile?.id ?? uuid());
  const initialNames = useMemo(
    () => deriveNameParts(initialProfile),
    [initialProfile],
  );
  const [firstName, setFirstName] = useState(initialNames.firstName);
  const [lastName, setLastName] = useState(initialNames.lastName);

  const handleContinue = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const latestProfile = getUserProfile();
    const baseProfile: UserProfile = latestProfile ?? {
      id: profileId,
      name: "",
      email: "",
    };

    const updatedProfile: UserProfile = {
      ...baseProfile,
      id: baseProfile.id || profileId,
      email: baseProfile.email ?? "",
      name: `${trimmedFirst} ${trimmedLast}`.trim(),
      firstName: trimmedFirst,
      lastName: trimmedLast,
    };

    saveUserProfile(updatedProfile);
    onNext();
  };

  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <Stack spacing={2} aria-label="Provide your name">
      <Typography variant="body1">
        We&apos;ll use your name to personalize prompt outputs like cover letters
        and outreach messages.
      </Typography>
      <TextField
        label="First Name"
        aria-label="First name"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        autoComplete="given-name"
        autoFocus
      />
      <TextField
        label="Last Name"
        aria-label="Last name"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
        autoComplete="family-name"
      />
      <Stack direction="row" spacing={1}>
        {onBack && (
          <Button onClick={onBack} aria-label="Back">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!canContinue}
          aria-label="Continue"
        >
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
