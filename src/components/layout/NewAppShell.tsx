import type { ReactNode } from "react";
import { CenterStage } from "@/components/layout/CenterStage";
import { FooterBar } from "@/components/layout/FooterBar";
import { NavRail, type PageId } from "@/components/layout/NavRail";
import { ResourceBar } from "@/components/layout/ResourceBar";

type NewAppShellProps = {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
};

export function NewAppShell({ activePage, onNavigate, children }: NewAppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base">
      <ResourceBar />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Desktop: left rail */}
        <div className="hidden lg:flex">
          <NavRail activePage={activePage} onNavigate={onNavigate} layout="rail" />
        </div>
        <CenterStage>{children}</CenterStage>
      </div>
      <FooterBar />
      {/* Mobile: bottom tab bar */}
      <div className="lg:hidden">
        <NavRail activePage={activePage} onNavigate={onNavigate} layout="bar" />
      </div>
    </div>
  );
}
