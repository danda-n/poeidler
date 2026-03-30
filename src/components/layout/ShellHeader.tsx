import type { ReactNode } from "react";

type ShellHeaderProps = {
  brandTitle: string;
  statusText: string;
  headerActions?: ReactNode;
  topBar: ReactNode;
};

export function ShellHeader({ brandTitle, statusText, headerActions, topBar }: ShellHeaderProps) {
  return (
    <header className="shell-topbar">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-[3px]">
          <h1 className="shell-brand-title">{brandTitle}</h1>
          <span className="shell-brand-status">{statusText}</span>
        </div>
        <div className="shrink-0">{headerActions}</div>
      </div>
      {topBar}
    </header>
  );
}
