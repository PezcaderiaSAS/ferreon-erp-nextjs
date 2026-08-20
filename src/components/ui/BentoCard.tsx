import React, { HTMLAttributes } from 'react';

export interface BentoCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function BentoCard({
  children,
  interactive = false,
  className = '',
  ...props
}: BentoCardProps) {
  const baseStyles = "glass-panel p-6 flex flex-col gap-4";
  const interactiveStyles = interactive ? "glass-panel-hover cursor-pointer" : "";

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
