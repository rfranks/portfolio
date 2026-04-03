export type BGMChord = readonly string[];

export interface UseBGMOptions {
  bpm?: number;
  beatsPerChord?: number;
  volume?: number;
  waveform?: OscillatorType;
  bassWaveform?: OscillatorType;
  swing?: number;
}

export interface UseAmbienceOptions {
  minDelayMs?: number;
  maxDelayMs?: number;
  minVolume?: number;
  maxVolume?: number;
}
