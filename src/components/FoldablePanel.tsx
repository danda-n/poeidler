import React from "react";

type FoldablePanelProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function FoldablePanel({ title, defaultOpen = true, children }: FoldablePanelProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <section className="border border-border-subtle rounded-xl bg-[rgba(255,255,255,0.02)] overflow-hidden">
      <button className="flex items-center gap-2 w-full px-3.5 py-2.5 border-0 text-[#ccc] bg-[rgba(255,255,255,0.03)] cursor-pointer text-left text-[0.82rem] font-semibold uppercase tracking-[0.05em] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)]" type="button" onClick={() => setIsOpen((value) => !value)}>
        <span className="w-3.5 text-center text-[0.72rem] text-text-muted transition-transform duration-200">{isOpen ? "\u25BE" : "\u25B8"}</span>
        <span>{title}</span>
      </button>
      <div className="px-3.5 pt-2.5 pb-3.5" style={{ display: isOpen ? "block" : "none" }} aria-hidden={!isOpen}>{children}</div>
    </section>
  );
}
