import type { ReactNode } from "react";

type GameLayoutProps = {
  children: ReactNode;
};

function GameLayout({ children }: GameLayoutProps) {
  return <div className="main-content">{children}</div>;
}

export default GameLayout;
