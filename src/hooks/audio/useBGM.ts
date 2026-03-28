import * as React from "react";

export type BGMChord = readonly string[];

type UseBGMOptions = {
  bpm?: number;
  beatsPerChord?: number;
  volume?: number;
  waveform?: OscillatorType;
  bassWaveform?: OscillatorType;
  swing?: number;
};

const SEMITONES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function noteToFrequency(note: string) {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note.trim());
  if (!match) {
    throw new Error(`Unsupported note format: ${note}`);
  }

  const pitchClass = `${match[1].toUpperCase()}${match[2]}`;
  const octave = Number(match[3]);
  const semitone = SEMITONES[pitchClass];

  if (semitone === undefined) {
    throw new Error(`Unsupported pitch class: ${pitchClass}`);
  }

  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function lowerRoot(note: string) {
  const match = /^([A-Ga-g][#b]?)(-?\d+)$/.exec(note.trim());
  if (!match) {
    return note;
  }
  return `${match[1]}${Number(match[2]) - 1}`;
}

function transposeNote(note: string, semitoneOffset: number) {
  const frequency = noteToFrequency(note);
  const shiftedFrequency = frequency * Math.pow(2, semitoneOffset / 12);
  return shiftedFrequency;
}

function noteToMidi(note: string) {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note.trim());
  if (!match) {
    throw new Error(`Unsupported note format: ${note}`);
  }

  const pitchClass = `${match[1].toUpperCase()}${match[2]}`;
  const octave = Number(match[3]);
  const semitone = SEMITONES[pitchClass];

  if (semitone === undefined) {
    throw new Error(`Unsupported pitch class: ${pitchClass}`);
  }

  return (octave + 1) * 12 + semitone;
}

function midiToFrequency(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function buildVoicing(chord: BGMChord, step: number) {
  const midiNotes = chord.map(noteToMidi).sort((a, b) => a - b);
  const inversion = step % Math.max(midiNotes.length, 1);
  const rotated = midiNotes.map((_, index) => {
    const source = midiNotes[(index + inversion) % midiNotes.length];
    return index + inversion >= midiNotes.length ? source + 12 : source;
  });

  return rotated.map((midi, index) => {
    const tightened =
      index > 0 && midi - rotated[index - 1] > 8 ? midi - 12 : midi;
    return midiToFrequency(tightened);
  });
}

export function useBGM(
  progression: readonly BGMChord[],
  {
    bpm = 64,
    beatsPerChord = 4,
    volume = 0.045,
    waveform = "triangle",
    bassWaveform = "sine",
    swing = 0.08,
  }: UseBGMOptions = {},
) {
  const [enabled, setEnabled] = React.useState(true);
  const [started, setStarted] = React.useState(false);
  const contextRef = React.useRef<AudioContext | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const enabledRef = React.useRef(true);
  const runningRef = React.useRef(false);
  const stepRef = React.useRef(0);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getContext = React.useCallback(() => {
    if (!contextRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) {
        return null;
      }
      contextRef.current = new Ctor();
    }
    return contextRef.current;
  }, []);

  const playChord = React.useCallback(
    (chord: BGMChord, nextChord: BGMChord | undefined, step: number) => {
      const context = getContext();
      if (!context || chord.length === 0) return;

      const now = context.currentTime;
      const secondsPerBeat = 60 / bpm;
      const voicing = buildVoicing(chord, step);
      const chordHits = [
        { offset: 0, length: 1.25, gain: 1 },
        { offset: secondsPerBeat * (1 + swing), length: 0.78, gain: 0.58 },
        { offset: secondsPerBeat * 2, length: 0.96, gain: 0.72 },
        { offset: secondsPerBeat * (3 + swing * 0.6), length: 0.62, gain: 0.42 },
      ];

      chordHits.forEach(({ offset, length, gain }) => {
        const hitAt = now + offset;
        const stopAt = hitAt + secondsPerBeat * length;
        const chordGain = context.createGain();
        const filter = context.createBiquadFilter();

        filter.type = "lowpass";
        filter.frequency.value = 1450 + (step % 3) * 140;
        filter.Q.value = 0.9;

        chordGain.connect(filter);
        filter.connect(context.destination);
        chordGain.gain.setValueAtTime(0.0001, hitAt);
        chordGain.gain.exponentialRampToValueAtTime(volume * gain, hitAt + 0.04);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

        voicing.forEach((frequency, index) => {
          const osc = context.createOscillator();
          const voiceGain = context.createGain();
          osc.type = waveform;
          osc.frequency.value = frequency;
          osc.detune.value = (index - (voicing.length - 1) / 2) * 4 + (step % 2 === 0 ? -2 : 2);
          voiceGain.gain.value = 1 / Math.max(voicing.length, 1);
          osc.connect(voiceGain);
          voiceGain.connect(chordGain);
          osc.start(hitAt);
          osc.stop(stopAt + 0.02);
        });
      });

      const bassNotes = [
        { at: now, frequency: noteToFrequency(lowerRoot(chord[0])), gain: 0.58 },
        {
          at: now + secondsPerBeat * 2,
          frequency: transposeNote(lowerRoot(chord[0]), step % 2 === 0 ? 7 : 5),
          gain: 0.34,
        },
      ];

      if (nextChord && nextChord.length > 0) {
        bassNotes.push({
          at: now + secondsPerBeat * 3.2,
          frequency: noteToFrequency(lowerRoot(nextChord[0])),
          gain: 0.24,
        });
      }

      bassNotes.forEach(({ at, frequency, gain }) => {
        const bassOsc = context.createOscillator();
        const bassGain = context.createGain();
        const bassFilter = context.createBiquadFilter();

        bassOsc.type = bassWaveform;
        bassOsc.frequency.value = frequency;
        bassFilter.type = "lowpass";
        bassFilter.frequency.value = 420;
        bassGain.gain.setValueAtTime(0.0001, at);
        bassGain.gain.exponentialRampToValueAtTime(volume * gain, at + 0.03);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, at + secondsPerBeat * 0.9);

        bassOsc.connect(bassGain);
        bassGain.connect(bassFilter);
        bassFilter.connect(context.destination);
        bassOsc.start(at);
        bassOsc.stop(at + secondsPerBeat);
      });
    },
    [bassWaveform, bpm, getContext, swing, volume, waveform],
  );

  const scheduleNext = React.useCallback(() => {
    if (!runningRef.current || !enabledRef.current || progression.length === 0) {
      return;
    }

    const chordIndex = stepRef.current % progression.length;
    const chord = progression[chordIndex];
    const nextChord = progression[(chordIndex + 1) % progression.length];
    playChord(chord, nextChord, stepRef.current);
    stepRef.current += 1;

    const delayMs = (60 / bpm) * beatsPerChord * 1000;
    timerRef.current = window.setTimeout(scheduleNext, delayMs);
  }, [beatsPerChord, bpm, playChord, progression]);

  const start = React.useCallback(async () => {
    enabledRef.current = true;
    setEnabled(true);

    const context = getContext();
    if (!context) return;

    if (context.state === "suspended") {
      await context.resume();
    }

    if (runningRef.current) return;

    runningRef.current = true;
    setStarted(true);
    scheduleNext();
  }, [getContext, scheduleNext]);

  const stop = React.useCallback(async () => {
    enabledRef.current = false;
    setEnabled(false);
    runningRef.current = false;
    clearTimer();

    const context = contextRef.current;
    if (context && context.state === "running") {
      await context.suspend();
    }
  }, [clearTimer]);

  const toggle = React.useCallback(() => {
    if (enabledRef.current) {
      void stop();
    } else {
      void start();
    }
  }, [start, stop]);

  React.useEffect(
    () => () => {
      runningRef.current = false;
      clearTimer();
      const context = contextRef.current;
      if (context) {
        void context.close();
      }
    },
    [clearTimer],
  );

  return { enabled, started, start, stop, toggle };
}
