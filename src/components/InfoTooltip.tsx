import { useState, useRef, useEffect } from 'react';

interface Props {
  text: string;
}

export function InfoTooltip({ text }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <span ref={ref} className="relative inline-block align-middle ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold hover:bg-gray-300 leading-none"
        aria-label="More info"
      >
        ?
      </button>
      {visible && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl leading-relaxed">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-800" />
        </div>
      )}
    </span>
  );
}
