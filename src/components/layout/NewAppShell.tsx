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
      <div className="flex flex-1 overflow-hidden">
        <NavRail activePage={activePage} onNavigate={onNavigate} />
        <CenterStage>{children}</CenterStage>
      </div>
      <FooterBar />
    </div>
  );
}
