export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface DiceInventoryBreakdown {
  label: string;
  count: number;
  ownedQty: number;
  wantQty: number;
}

export interface DiceInventoryReport {
  totalCount: number;
  ownedCount: number;
  wantedCount: number;
  cleanupCount: number;
  ownedQty: number;
  wantQty: number;
  setBreakdown: DiceInventoryBreakdown[];
  statusBreakdown: DiceInventoryBreakdown[];
}

export interface DiceGameLookups {
  sets: string[];
  rarities: string[];
}

export interface DragonDiceLookups {
  races: string[];
  roles: string[];
}

export interface DiceGameItem {
  id: number;
  gameName: string;
  setName: string;
  cardId: string | null;
  cardNumber: string | null;
  cardName: string;
  subtitle: string | null;
  cost: number | null;
  energyType: string | null;
  alignment: string | null;
  equippable: string | null;
  rarity: string | null;
  dieLimit: number | null;
  ownedCardQty: number;
  ownedDieQty: number;
  ownedFoilQty: number;
  wantQty: number;
  statusID: 'H' | 'W';
  notes: string | null;
  sourceSheet: string | null;
  sourceRowLabel: string | null;
}

export type UpsertDiceGameItem = Omit<DiceGameItem, 'id'>;

export interface DragonDiceItem {
  id: number;
  dieName: string;
  raceOrSpecies: string | null;
  role: string | null;
  dieType: string | null;
  health: string | null;
  points: string | null;
  ownedQty: number;
  wantQty: number;
  statusID: 'H' | 'W';
  noteCode: string | null;
  isAlternative: boolean;
  isReprint: boolean;
  notes: string | null;
  sourceSheet: string | null;
  sourceRowLabel: string | null;
}

export type UpsertDragonDiceItem = Omit<DragonDiceItem, 'id'>;
