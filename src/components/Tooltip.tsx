import type { ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex items-center">
      {children}
      <span className="hidden group-hover:block absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 px-2.5 py-2 rounded-lg bg-bg-elevated border border-border-default shadow-[0_4px_16px_rgba(0,0,0,0.4)] text-[#ccc] text-[0.72rem] leading-[1.4] whitespace-pre-line z-50">
        {content}
      </span>
    </span>
  );
}
