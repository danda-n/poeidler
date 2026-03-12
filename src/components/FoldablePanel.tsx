import React from "react";

type FoldablePanelProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function FoldablePanel({ title, defaultOpen = true, children }: FoldablePanelProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <section className="foldable-panel">
      <button className="foldable-trigger" type="button" onClick={() => setIsOpen((value) => !value)}>
        <span className="foldable-icon">{isOpen ? "\u25BE" : "\u25B8"}</span>
        <span>{title}</span>
      </button>
      {isOpen ? <div className="foldable-content">{children}</div> : null}
    </section>
  );
}
