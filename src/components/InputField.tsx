interface Props {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
}

export function InputField({ label, value, onChange, prefix, suffix, step = 1, min = 0 }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {prefix && <span className="px-3 text-gray-400 text-sm border-r border-gray-200 bg-gray-50 self-stretch flex items-center">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 px-3 py-2 text-sm text-gray-800 outline-none bg-white min-w-0"
        />
        {suffix && <span className="px-3 text-gray-400 text-sm border-l border-gray-200 bg-gray-50 self-stretch flex items-center">{suffix}</span>}
      </div>
    </div>
  );
}
