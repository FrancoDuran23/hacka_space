/** The operator shown when nobody is signed in (public demo). */
export const DEFAULT_OPERATOR = "ESA";

/**
 * Operator name (as in the dataset and the account name) → its OWNER code in CelesTrak's SATCAT, which
 * is a country or agency code, not the company: Iridium and NASA are both "US".
 */
const SATCAT_OWNER: Record<string, string> = {
  ESA: "ESA",
  NASA: "US",
  Iridium: "US",
  JAXA: "JPN",
  CMA: "PRC",
  Roscosmos: "CIS",
  "VKS · RU MoD": "CIS",
  CONAE: "ARGN",
};

export const satcatOwner = (operator: string): string | null => SATCAT_OWNER[operator] ?? null;
