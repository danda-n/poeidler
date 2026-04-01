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

// Node dimensions
export const NODE_WIDTH = 110;
export const NODE_HEIGHT = 48;

// Graph dimensions
export const GRAPH_WIDTH = 820;
export const GRAPH_HEIGHT = 480;

export const nodePositions: NodePosition[] = [
  // ── Cartography branch (left) ──
  { talentId: "surveyorsEye",    x: 80,  y: 120, branch: "cartography" },
  { talentId: "hiddenStashes",   x: 210, y: 120, branch: "cartography" },
  { talentId: "efficientRolling",x: 80,  y: 210, branch: "cartography" },
  { talentId: "pathMemory",      x: 210, y: 210, branch: "cartography" },
  { talentId: "fieldReports",    x: 210, y: 300, branch: "cartography" },
  { talentId: "hazardCharts",    x: 210, y: 390, branch: "cartography" },

  // ── Economy branch (center) ──
  { talentId: "firmHand",              x: 370, y: 120, branch: "economy" },
  { talentId: "bulkContracts",         x: 490, y: 120, branch: "economy" },
  { talentId: "compoundingCraft",      x: 370, y: 210, branch: "economy" },
  { talentId: "streamlinedConversion", x: 490, y: 210, branch: "economy" },

  // ── Reflection branch (right) ──
  { talentId: "crackedMirror",    x: 680, y: 120, branch: "reflection" },
  { talentId: "lingeringWealth",  x: 680, y: 210, branch: "reflection" },
  { talentId: "echoingArchives",  x: 680, y: 300, branch: "reflection" },
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
  { branch: "cartography", x: 145, y: 65 },
  { branch: "economy", x: 430, y: 65 },
  { branch: "reflection", x: 680, y: 65 },
];
