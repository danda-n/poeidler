import type { ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
};

function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="tooltip-wrapper">
      {children}
      <span className="tooltip-content">{content}</span>
    </span>
  );
}

export default Tooltip;
