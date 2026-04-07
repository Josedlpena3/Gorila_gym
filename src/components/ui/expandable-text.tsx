"use client";

import { useState } from "react";

type ExpandableTextProps = {
  text: string;
  collapsedLength?: number;
  className?: string;
  buttonClassName?: string;
};

export function ExpandableText({
  text,
  collapsedLength = 140,
  className = "",
  buttonClassName = ""
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= collapsedLength) {
    return <p className={className}>{text}</p>;
  }

  const visibleText = expanded ? text : `${text.slice(0, collapsedLength).trimEnd()}...`;

  return (
    <div className="space-y-2">
      <p className={className}>{visibleText}</p>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={`text-sm font-semibold text-neon transition hover:text-neon/80 ${buttonClassName}`.trim()}
      >
        {expanded ? "Ver menos" : "Ver más"}
      </button>
    </div>
  );
}
