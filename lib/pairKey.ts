/**
 * Order-independent pair key: sort the two ids alphabetically then join with "+".
 * pairKey("naoh", "cuso4") === pairKey("cuso4", "naoh") === "cuso4+naoh"
 */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("+");
}
