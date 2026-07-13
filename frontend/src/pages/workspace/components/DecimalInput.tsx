type DecimalInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function DecimalInput({ label, value, onChange }: DecimalInputProps) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" />
    </label>
  );
}
