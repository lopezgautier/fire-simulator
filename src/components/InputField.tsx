import { useState, useEffect, useRef } from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  decimals?: number; // display precision, default 2
}

export function InputField({ label, value, onChange, prefix, suffix, step = 1, min = 0, decimals = 2 }: Props) {
  // Round incoming value to avoid floating-point display artifacts (e.g. 0.06*100 = 6.000000000000001)
  const rounded = parseFloat(value.toFixed(decimals));
  const [localValue, setLocalValue] = useState(String(rounded));
  const focused = useRef(false);

  // Sync from parent only when the field is not being edited
  useEffect(() => {
    if (!focused.current) {
      setLocalValue(String(parseFloat(value.toFixed(decimals))));
    }
  }, [value, decimals]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {prefix && (
          <span className="px-3 text-gray-400 text-sm border-r border-gray-200 bg-gray-50 self-stretch flex items-center">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={localValue}
          step={step}
          min={min}
          onFocus={() => { focused.current = true; }}
          onBlur={() => {
            focused.current = false;
            const parsed = parseFloat(localValue);
            if (!isNaN(parsed)) {
              // Normalize display on blur
              setLocalValue(String(parseFloat(parsed.toFixed(decimals))));
              onChange(parsed);
            } else {
              // Reset to last valid parent value on invalid input
              setLocalValue(String(parseFloat(value.toFixed(decimals))));
            }
          }}
          onChange={e => {
            setLocalValue(e.target.value);
            const parsed = parseFloat(e.target.value);
            if (!isNaN(parsed)) onChange(parsed);
          }}
          className="flex-1 px-3 py-2 text-sm text-gray-800 outline-none bg-white min-w-0"
        />
        {suffix && (
          <span className="px-3 text-gray-400 text-sm border-l border-gray-200 bg-gray-50 self-stretch flex items-center">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
