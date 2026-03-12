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
      <div className="shell-brand-row">
        <div className="shell-brand-copy">
          <h1 className="shell-brand-title">{brandTitle}</h1>
          <span className="shell-brand-status">{statusText}</span>
        </div>
        <div className="shell-brand-actions">{headerActions}</div>
      </div>
      {topBar}
    </header>
  );
}
