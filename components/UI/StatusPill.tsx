import React from 'react';

type StatusType = 'good' | 'warning' | 'info' | 'error';

interface StatusPillProps {
  status: StatusType;
  text: string;
  className?: string;
}

export default function StatusPill({ status, text, className = '' }: StatusPillProps) {
  const colors = {
    good: 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-100 border-amber-500/30',
    info: 'bg-blue-500/20 text-blue-100 border-blue-500/30',
    error: 'bg-red-500/20 text-red-100 border-red-500/30',
  };

  const dots = {
    good: 'bg-emerald-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400',
    error: 'bg-red-400',
  };

  return (
    <div
      className={`
        flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md transition-all duration-300
        ${colors[status]} ${className}
      `}
    >
      <span className={`relative flex h-2 w-2`}>
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dots[status]}`}></span>
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dots[status]}`}></span>
      </span>
      <span className="text-xs font-medium tracking-wide shadow-black drop-shadow-md">
        {text}
      </span>
    </div>
  );
}
