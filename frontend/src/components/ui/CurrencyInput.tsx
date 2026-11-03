'use client';

import React from 'react';

interface CurrencyInputProps {
  id?: string;
  name?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function CurrencyInput({
  id,
  name,
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  required = false,
  className = '',
}: CurrencyInputProps) {
  // Format numeric value for display
  const displayValue = value > 0 ? new Intl.NumberFormat('id-ID').format(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digit chars
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    onChange(num);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute left-3.5 text-xs font-semibold text-slate-400 select-none">
        Rp
      </span>
      <input
        type="text"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="input-field pl-10 pr-3 font-medium text-slate-800"
      />
    </div>
  );
}

