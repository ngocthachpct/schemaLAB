/** Badge tiers (spec 5.5), computed from the number of discovered reactions. */
export function badgeForCount(count: number): string {
  if (count >= 10) return "Bậc thầy Hóa học";
  if (count >= 5) return "Nhà nghiên cứu";
  if (count >= 1) return "Tập sự";
  return "Chưa có";
}

export const BADGE_TIERS = [
  { min: 10, label: "Bậc thầy Hóa học" },
  { min: 5, label: "Nhà nghiên cứu" },
  { min: 1, label: "Tập sự" },
] as const;
