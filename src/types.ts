export type SlotValue = "yes" | "no" | "first" | "second";

export type DaySchedule = Record<string, SlotValue>;

export type FactDay = Record<string, DaySchedule>;

export type FactCollection = Record<string, FactDay>;

export interface PowerStatus {
  has_power: boolean | null;
  next_off: string | null;
  next_on: string | null;
}
