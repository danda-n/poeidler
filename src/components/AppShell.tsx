import type { ReactNode } from "react";

type AppShellProps = {
  brandTitle: string;
  statusText: string;
  pageTitle: string;
  pageDescription: string;
  headerActions?: ReactNode;
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AppShell({
  brandTitle,
  statusText,
  pageTitle,
  pageDescription,
  headerActions,
  topBar,
  sidebar,
  children,
  footer,
}: AppShellProps) {
  return (
    <div className="shell-root">
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

      <div className="shell-body">
        <aside className="shell-sidebar-frame">{sidebar}</aside>
        <main className="shell-main">
          <div className="shell-main-inner">
            <header className="shell-page-header">
              <div>
                <p className="shell-page-eyebrow">Current screen</p>
                <h2 className="shell-page-title">{pageTitle}</h2>
                <p className="shell-page-description">{pageDescription}</p>
              </div>
            </header>

            {children}

            {footer}
          </div>
        </main>
      </div>
    </div>
  );
}
