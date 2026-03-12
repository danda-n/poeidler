import type { ReactNode } from "react";
import { ShellHeader } from "@/components/layout/ShellHeader";
import { ShellPageHeader } from "@/components/layout/ShellPageHeader";

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
      <ShellHeader brandTitle={brandTitle} statusText={statusText} headerActions={headerActions} topBar={topBar} />

      <div className="shell-body">
        <aside className="shell-sidebar-frame">{sidebar}</aside>
        <main className="shell-main">
          <div className="shell-main-inner">
            <ShellPageHeader title={pageTitle} description={pageDescription} />

            {children}

            {footer}
          </div>
        </main>
      </div>
    </div>
  );
}
