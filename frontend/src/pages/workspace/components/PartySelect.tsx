import { PARTY_ALIASES, type PartyAlias } from '@canton-demo/shared/demo-money';

type PartySelectProps = {
  label: string;
  value: PartyAlias;
  onChange: (value: PartyAlias) => void;
};

export function PartySelect({ label, value, onChange }: PartySelectProps) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value as PartyAlias)}>
        {PARTY_ALIASES.map((alias) => (
          <option key={alias} value={alias}>
            {alias}
          </option>
        ))}
      </select>
    </label>
  );
}
