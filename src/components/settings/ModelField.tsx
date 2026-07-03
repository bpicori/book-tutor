interface ModelFieldProps {
  label: string;
  description: string;
  value: string;
  availableModels: string[];
  onChange: (value: string) => void;
}

export function ModelField({
  label,
  description,
  value,
  availableModels,
  onChange,
}: ModelFieldProps) {
  const hasModels = availableModels.length > 0;
  const inputClassName =
    "w-full px-4 py-2 rounded-lg border border-border-warm bg-warm-off-white text-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent";

  return (
    <div>
      <label className="block text-sm font-medium text-muted-gray-text mb-3">
        {label}
      </label>
      {hasModels ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        >
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          placeholder="Enter model ID (e.g., gpt-4o-mini)"
        />
      )}
      <p className="mt-2 text-xs text-light-gray-text">{description}</p>
    </div>
  );
}
