import type { TalentBranch } from "@/game/talents";

export type NodePosition = {
  talentId: string;
  x: number;
  y: number;
  branch: TalentBranch;
};

export type EdgeConnection = {
  from: string;
  to: string;
};

// Graph dimensions: 700 x 500 viewport
// Hub at top-center, three branches spread down-left, down-center, down-right

export const GRAPH_WIDTH = 700;
export const GRAPH_HEIGHT = 480;

export const nodePositions: NodePosition[] = [
  // ── Cartography branch (left) ──
  { talentId: "surveyorsEye",    x: 80,  y: 120, branch: "cartography" },
  { talentId: "hiddenStashes",   x: 180, y: 120, branch: "cartography" },
  { talentId: "efficientRolling",x: 80,  y: 220, branch: "cartography" },
  { talentId: "pathMemory",      x: 180, y: 220, branch: "cartography" },
  { talentId: "fieldReports",    x: 180, y: 320, branch: "cartography" },
  { talentId: "hazardCharts",    x: 180, y: 420, branch: "cartography" },

  // ── Economy branch (center) ──
  { talentId: "firmHand",              x: 310, y: 120, branch: "economy" },
  { talentId: "bulkContracts",         x: 410, y: 120, branch: "economy" },
  { talentId: "compoundingCraft",      x: 310, y: 220, branch: "economy" },
  { talentId: "streamlinedConversion", x: 410, y: 220, branch: "economy" },

  // ── Reflection branch (right) ──
  { talentId: "crackedMirror",    x: 540, y: 120, branch: "reflection" },
  { talentId: "lingeringWealth",  x: 540, y: 220, branch: "reflection" },
  { talentId: "echoingArchives",  x: 540, y: 320, branch: "reflection" },
];

export const edgeConnections: EdgeConnection[] = [
  // Cartography chain
  { from: "hiddenStashes", to: "pathMemory" },
  { from: "pathMemory", to: "fieldReports" },
  { from: "fieldReports", to: "hazardCharts" },
  // Economy chain
  { from: "firmHand", to: "compoundingCraft" },
  // Reflection chain
  { from: "crackedMirror", to: "lingeringWealth" },
  { from: "lingeringWealth", to: "echoingArchives" },
];

export const branchColors: Record<TalentBranch, { active: string; glow: string; dim: string }> = {
  cartography: { active: "#f4d58c", glow: "rgba(244,213,140,0.4)", dim: "rgba(244,213,140,0.15)" },
  economy:     { active: "#8be9fd", glow: "rgba(139,233,253,0.4)", dim: "rgba(139,233,253,0.15)" },
  reflection:  { active: "#bd93f9", glow: "rgba(189,147,249,0.4)", dim: "rgba(189,147,249,0.15)" },
};

export const branchLabels: { branch: TalentBranch; x: number; y: number }[] = [
  { branch: "cartography", x: 130, y: 70 },
  { branch: "economy", x: 360, y: 70 },
  { branch: "reflection", x: 540, y: 70 },
];
