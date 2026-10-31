export const LEVELS = [
  { id: 1, key: "beginner", label: "Beginner", xp: 50 },
  { id: 2, key: "intermediate", label: "Intermediate", xp: 100 },
  { id: 3, key: "advanced", label: "Advanced", xp: 200 },
  { id: 4, key: "expert", label: "Expert", xp: 400 },
] as const;

export type LevelKey = (typeof LEVELS)[number]["key"];

export function levelLabel(level: number) {
  return LEVELS.find((item) => item.id === level)?.label ?? "Training";
}
