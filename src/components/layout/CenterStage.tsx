import type { ReactNode } from "react";

type CenterStageProps = {
  children: ReactNode;
};

export function CenterStage({ children }: CenterStageProps) {
  return (
    <div className="flex-1 min-w-0 overflow-hidden p-3 sm:p-4">
      {children}
    </div>
  );
}
