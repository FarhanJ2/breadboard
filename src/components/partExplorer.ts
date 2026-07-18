/** One highlightable part in a PartExplorer diagram. */
export type Part = {
  /** Matches the render filename (`<key>.png`) inside the explorer's base path. */
  key: string;
  /** Which callout column the label sits in. */
  side: "left" | "right";
  kicker: string;
  desc: string;
  /** Hotspot position, % of the stage. */
  hx: number;
  hy: number;
};
