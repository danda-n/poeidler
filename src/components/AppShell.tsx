import { forwardRef, type ReactNode } from "react";
import { ShellHeader } from "@/components/layout/ShellHeader";
import { ShellPageHeader } from "@/components/layout/ShellPageHeader";

type AppShellProps = {
  brandTitle: string;
  statusText: string;
  pageTitle: string;
  pageDescription: string;
  contentWidth?: "default" | "wide";
  headerActions?: ReactNode;
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export const AppShell = forwardRef<HTMLElement, AppShellProps>(function AppShell(
  {
    brandTitle,
    statusText,
    pageTitle,
    pageDescription,
    contentWidth = "default",
    headerActions,
    topBar,
    sidebar,
    children,
    footer,
  },
  ref,
) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ShellHeader brandTitle={brandTitle} statusText={statusText} headerActions={headerActions} topBar={topBar} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="shell-sidebar-frame">{sidebar}</aside>
        <main ref={ref} className="shell-main">
          <div className={`shell-main-inner${contentWidth === "wide" ? " shell-main-inner-wide" : ""}`}>
            <ShellPageHeader title={pageTitle} description={pageDescription} />

            {children}

            {footer}
          </div>
        </main>
      </div>
    </div>
  );
});
