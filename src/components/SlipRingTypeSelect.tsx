"use client";

import { useState } from "react";
import { inputStyles } from "@/components/ui";
import { SEEDED_SLIP_RING_TYPES } from "@/lib/constants";

type SlipRingTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  knownTypes: string[];
  id?: string;
  required?: boolean;
};

const CUSTOM = "__custom__";

export function SlipRingTypeSelect({
  value,
  onChange,
  knownTypes,
  id,
  required,
}: SlipRingTypeSelectProps) {
  const options = Array.from(
    new Set([...SEEDED_SLIP_RING_TYPES, ...knownTypes]),
  ).sort((a, b) => a.localeCompare(b));

  const [customMode, setCustomMode] = useState(false);
  const isCustom = customMode || (value.length > 0 && !options.includes(value));

  return (
    <div className="space-y-2">
      <select
        id={id}
        required={required}
        value={isCustom ? CUSTOM : value}
        onChange={(event) => {
          const next = event.target.value;
          setCustomMode(next === CUSTOM);
          onChange(next === CUSTOM ? "" : next);
        }}
        className={inputStyles}
      >
        <option value="" disabled>
          Select type
        </option>
        {options.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
        <option value={CUSTOM}>Other (type a new one)…</option>
      </select>
      {isCustom && (
        <input
          value={value}
          required={required}
          autoFocus
          placeholder="New slip ring type"
          onChange={(event) => onChange(event.target.value)}
          className={inputStyles}
        />
      )}
    </div>
  );
}
