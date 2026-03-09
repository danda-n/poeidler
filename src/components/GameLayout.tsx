import type { ReactNode } from "react";

type GameLayoutProps = {
  children: ReactNode;
};

function GameLayout({ children }: GameLayoutProps) {
  return <div className="game-container">{children}</div>;
}

export default GameLayout;
