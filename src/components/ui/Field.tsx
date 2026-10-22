import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  span2?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, span2, children }: FieldProps) {
  return (
    <div className={`field${span2 ? " span-2" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="note">{hint}</p>}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function TextInput({ className = "", ...props }: TextInputProps) {
  return (
    <input className={`input${className ? ` ${className}` : ""}`} {...props} />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select className={`input${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </select>
  );
}

interface RangeProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  id?: string;
}

export function Range({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  id,
}: RangeProps) {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      style={{ "--pct": `${percent.toFixed(2)}%` } as CSSProperties}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
