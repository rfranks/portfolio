"use client";

type BlackjackAudioToggleProps = {
  checked: boolean;
  className?: string;
  inputClassName?: string;
  label: string;
  onChange: () => void;
};

export default function BlackjackAudioToggle({
  checked,
  className,
  inputClassName,
  label,
  onChange,
}: BlackjackAudioToggleProps) {
  return (
    <label className={className}>
      <input
        className={inputClassName}
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}
