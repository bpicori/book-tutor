import { Icon } from "./Icon";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: SearchFieldProps) {
  return (
    <label className="search">
      <Icon name="search" size={14} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
