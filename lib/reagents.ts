export type ReagentGroup = "acid_base" | "salt" | "metal";
export type ReagentState = "solution" | "solid";

export interface Reagent {
  id: string;
  formula: string;
  nameVi: string;
  group: ReagentGroup;
  state: ReagentState;
  /** Initial solution color (HEX); for metals this is the metal color */
  color: string;
  /** Bottle label color by group */
  labelColor: string;
}

export const GROUP_LABELS_VI: Record<ReagentGroup, string> = {
  acid_base: "Axit & Bazơ",
  salt: "Muối",
  metal: "Kim loại",
};

const LABEL_ACID_BASE = "#fca5a5";
const LABEL_SALT = "#cbd5e1";
const LABEL_METAL = "#fdba74";

export const REAGENTS: readonly Reagent[] = [
  { id: "hcl", formula: "HCl", nameVi: "Axit clohiđric", group: "acid_base", state: "solution", color: "#e0f2fe", labelColor: LABEL_ACID_BASE },
  { id: "h2so4", formula: "H2SO4", nameVi: "Axit sunfuric loãng", group: "acid_base", state: "solution", color: "#e0f2fe", labelColor: LABEL_ACID_BASE },
  { id: "naoh", formula: "NaOH", nameVi: "Natri hiđroxit", group: "acid_base", state: "solution", color: "#e0f2fe", labelColor: LABEL_ACID_BASE },
  { id: "caoh2", formula: "Ca(OH)2", nameVi: "Nước vôi trong", group: "acid_base", state: "solution", color: "#e0f2fe", labelColor: LABEL_ACID_BASE },
  { id: "cuso4", formula: "CuSO4", nameVi: "Đồng(II) sunfat", group: "salt", state: "solution", color: "#60a5fa", labelColor: LABEL_SALT },
  { id: "bacl2", formula: "BaCl2", nameVi: "Bari clorua", group: "salt", state: "solution", color: "#e0f2fe", labelColor: LABEL_SALT },
  { id: "na2co3", formula: "Na2CO3", nameVi: "Natri cacbonat", group: "salt", state: "solution", color: "#e0f2fe", labelColor: LABEL_SALT },
  { id: "agno3", formula: "AgNO3", nameVi: "Bạc nitrat", group: "salt", state: "solution", color: "#e0f2fe", labelColor: LABEL_SALT },
  { id: "nacl", formula: "NaCl", nameVi: "Natri clorua", group: "salt", state: "solution", color: "#e0f2fe", labelColor: LABEL_SALT },
  { id: "fecl3", formula: "FeCl3", nameVi: "Sắt(III) clorua", group: "salt", state: "solution", color: "#fbbf24", labelColor: LABEL_SALT },
  { id: "fe", formula: "Fe", nameVi: "Sắt", group: "metal", state: "solid", color: "#6b7280", labelColor: LABEL_METAL },
  { id: "zn", formula: "Zn", nameVi: "Kẽm", group: "metal", state: "solid", color: "#9ca3af", labelColor: LABEL_METAL },
  { id: "mg", formula: "Mg", nameVi: "Magie", group: "metal", state: "solid", color: "#d1d5db", labelColor: LABEL_METAL },
  { id: "cu", formula: "Cu", nameVi: "Đồng", group: "metal", state: "solid", color: "#b45309", labelColor: LABEL_METAL },
];

export function getReagent(id: string): Reagent | undefined {
  return REAGENTS.find((r) => r.id === id);
}

export function isValidReagent(id: unknown): id is string {
  return typeof id === "string" && REAGENTS.some((r) => r.id === id);
}

export const REAGENT_IDS: readonly string[] = REAGENTS.map((r) => r.id);
