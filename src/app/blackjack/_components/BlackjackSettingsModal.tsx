"use client";

import { createPortal } from "react-dom";
import BlackjackAudioToggle from "./BlackjackAudioToggle";
import styles from "./BlackjackSettingsModal.module.css";

type BlackjackSettingsModalProps = {
  ambienceEnabled: boolean;
  bgmEnabled: boolean;
  closing: boolean;
  onClose: () => void;
  onModalOk: () => void;
  onToggleAllAudio: () => void;
  onToggleAmbience: () => void;
  onToggleBGM: () => void;
  onToggleSounds: () => void;
  open: boolean;
  soundsEnabled: boolean;
};

export default function BlackjackSettingsModal({
  ambienceEnabled,
  bgmEnabled,
  closing,
  onClose,
  onModalOk,
  onToggleAllAudio,
  onToggleAmbience,
  onToggleBGM,
  onToggleSounds,
  open,
  soundsEnabled,
}: BlackjackSettingsModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`blackjack-round-end-modal blackjack-settings-modal${closing ? " blackjack-round-end-modal--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blackjack-settings-modal-title"
    >
      <button
        type="button"
        className="blackjack-round-end-modal__backdrop"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className={`blackjack-round-end-modal__panel ${styles.settingsPanel}`}>
        <h3 id="blackjack-settings-modal-title" className={styles.settingsTitle}>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={styles.settingsTitleIcon}
          >
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.04 7.04 0 0 0-1.63-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.56 8.84a.5.5 0 0 0 .12.64L4.7 11.06c-.04.31-.06.62-.06.94s.02.63.07.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54a.49.49 0 0 0 .49.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.23.09.5 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"
            />
          </svg>
          <span>Settings</span>
        </h3>
        <div className={styles.settingsSection}>
          <div className={styles.settingsSectionTitle}>Audio</div>
          <div className={styles.audioToggles}>
            <button
              type="button"
              className={`${styles.audioLabel} ${styles.audioLabelButton}`}
              onClick={onToggleAllAudio}
              title={
                bgmEnabled && ambienceEnabled && soundsEnabled
                  ? "Turn all audio off"
                  : "Turn all audio on"
              }
              aria-label={
                bgmEnabled && ambienceEnabled && soundsEnabled
                  ? "Turn all audio off"
                  : "Turn all audio on"
              }
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className={styles.audioLabelIcon}
              >
                <path
                  d="M3 10v4h4l5 4V6L7 10H3zm12.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 15.5 12zm0-9.5v2.06a7.5 7.5 0 0 1 0 14.88v2.06a9.5 9.5 0 0 0 0-19z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <BlackjackAudioToggle
              checked={bgmEnabled}
              label="BGM"
              onChange={onToggleBGM}
              className={styles.audioToggle}
              inputClassName={styles.audioToggleInput}
            />
            <BlackjackAudioToggle
              checked={ambienceEnabled}
              label="Ambient"
              onChange={onToggleAmbience}
              className={styles.audioToggle}
              inputClassName={styles.audioToggleInput}
            />
            <BlackjackAudioToggle
              checked={soundsEnabled}
              label="Sounds"
              onChange={onToggleSounds}
              className={styles.audioToggle}
              inputClassName={styles.audioToggleInput}
            />
          </div>
        </div>
        <div className={styles.settingsActions}>
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
