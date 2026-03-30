import type { ReactNode } from "react";

type ShellHeaderProps = {
  brandTitle: string;
  statusText: string;
  headerActions?: ReactNode;
  topBar: ReactNode;
};

export function ShellHeader({ brandTitle, statusText, headerActions, topBar }: ShellHeaderProps) {
  return (
    <header className="relative z-5 shrink-0 grid gap-2.5 px-4 pt-2.5 pb-2 bg-[rgba(8,11,16,0.88)] border-b border-[rgba(255,255,255,0.08)] backdrop-blur-[10px]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-px">
          <h1 className="m-0 text-[clamp(1.1rem,1.5vw,1.45rem)] font-extrabold tracking-[-0.03em] text-[#f4d58c]">{brandTitle}</h1>
          <span className="text-[0.72rem] text-[#93a0b4]">{statusText}</span>
        </div>
        <div className="shrink-0">{headerActions}</div>
      </div>
      {topBar}
    </header>
  );
}
