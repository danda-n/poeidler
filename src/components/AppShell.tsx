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
        <aside className="w-[280px] shrink-0 px-3.5 pt-[18px] pb-[18px] pl-[18px] border-r border-border-subtle bg-[rgba(7,10,14,0.82)]">{sidebar}</aside>
        <main ref={ref} className="flex-1 min-w-0 overflow-y-auto overscroll-y-contain scroll-smooth px-5 pt-4 pb-5" style={{ scrollbarGutter: "stable" }}>
          <div className={`mx-auto grid gap-3.5 pb-4${contentWidth === "wide" ? " w-full max-w-[1680px]" : " w-[min(1280px,100%)]"}`}>
            <ShellPageHeader title={pageTitle} description={pageDescription} />

            {children}

            {footer}
          </div>
        </main>
      </div>
    </div>
  );
});
