import type { ReactNode } from "react";

type GameLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

function GameLayout({ left, center, right }: GameLayoutProps) {
  return (
    <div className="game-layout">
      <aside className="layout-column">{left}</aside>
      <section className="layout-column layout-column-center">{center}</section>
      <aside className="layout-column">{right}</aside>
    </div>
  );
}

export default GameLayout;
