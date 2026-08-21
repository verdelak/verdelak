export interface FishTank {
  id: number;
  name: string;
  gallons: number | null;
  location: string;
  isSetup: boolean;
  isActive: boolean;
  notes: string | null;
}

export interface FishTankRequest {
  name: string;
  gallons: number | null;
  location: string;
  isSetup: boolean;
  isActive: boolean;
  notes: string | null;
}

export interface FishTankLog {
  id: number;
  fishTankId: number;
  tankName: string;
  loggedAt: string;
  logType: string;
  temperature: number | null;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
  ph: number | null;
  gh: number | null;
  kh: number | null;
  notes: string | null;
}

export interface FishTankLogRequest {
  fishTankId: number;
  loggedAt: string;
  logType: string;
  temperature: number | null;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
  ph: number | null;
  gh: number | null;
  kh: number | null;
  notes: string | null;
}

export interface FishStock {
  id: number;
  fishTankId: number;
  tankName: string;
  commonName: string;
  scientificName: string | null;
  adultSize: string | null;
  temperament: string | null;
  temperaturePreference: string | null;
  phPreference: string | null;
  quantity: number;
  isActive: boolean;
  notes: string | null;
}

export interface FishStockRequest {
  fishTankId: number;
  commonName: string;
  scientificName: string | null;
  adultSize: string | null;
  temperament: string | null;
  temperaturePreference: string | null;
  phPreference: string | null;
  quantity: number;
  isActive: boolean;
  notes: string | null;
}

export interface FishSpeciesFood {
  id: number;
  fishSpeciesProfileId: number;
  foodName: string;
  foodType: string | null;
  feedingFrequency: string | null;
  isStaple: boolean;
  notes: string | null;
}

export interface FishSpeciesFoodRequest {
  foodName: string;
  foodType: string | null;
  feedingFrequency: string | null;
  isStaple: boolean;
  notes: string | null;
}

export interface FishSpeciesProfile {
  id: number;
  commonName: string;
  scientificName: string | null;
  adultSize: string | null;
  temperament: string | null;
  temperaturePreference: string | null;
  phPreference: string | null;
  ghPreference: string | null;
  khPreference: string | null;
  careLevel: string | null;
  tankLevel: string | null;
  isQuarantineRequired: boolean;
  notes: string | null;
  foods: FishSpeciesFood[];
}

export interface FishSpeciesProfileRequest {
  commonName: string;
  scientificName: string | null;
  adultSize: string | null;
  temperament: string | null;
  temperaturePreference: string | null;
  phPreference: string | null;
  ghPreference: string | null;
  khPreference: string | null;
  careLevel: string | null;
  tankLevel: string | null;
  isQuarantineRequired: boolean;
  notes: string | null;
}

export interface FishSpeciesProfileGap {
  fishSpeciesProfileId: number | null;
  fishStockId: number | null;
  fishTankId: number | null;
  tankName: string | null;
  commonName: string;
  scientificName: string | null;
  gapType: string;
  detail: string;
}

export interface FishTankTask {
  id: number;
  fishTankId: number;
  tankName: string;
  taskId: number;
  title: string;
  description: string | null;
  taskCategory: string;
  isActive: boolean;
  scheduleType: string;
  startDate: string;
  endDate: string | null;
  recurrencePattern: string;
  notes: string | null;
}

export interface FishTankTaskRequest {
  fishTankId: number;
  title: string;
  description: string | null;
  taskCategory: string;
  isActive: boolean;
  scheduleType: string;
  startDate: string;
  endDate: string | null;
  recurrencePattern: string;
  notes: string | null;
}

export interface FishLivestockEvent {
  id: number;
  fishTankId: number;
  tankName: string;
  destinationFishTankId: number | null;
  destinationTankName: string | null;
  eventDate: string;
  eventType: string;
  commonName: string;
  scientificName: string | null;
  quantity: number;
  updatesStock: boolean;
  notes: string | null;
}

export interface FishLivestockEventRequest {
  fishTankId: number;
  destinationFishTankId: number | null;
  eventDate: string;
  eventType: string;
  commonName: string;
  scientificName: string | null;
  quantity: number;
  updatesStock: boolean;
  notes: string | null;
}

export interface FishAquariumProduct {
  id: number;
  fishTankId: number | null;
  tankName: string | null;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  percentLeft: number | null;
  expirationDate: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface FishAquariumProductRequest {
  fishTankId: number | null;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  percentLeft: number | null;
  expirationDate: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface FishTankHistoryItem {
  id: string;
  fishTankId: number;
  tankName: string;
  occurredAt: string;
  kind: string;
  title: string;
  detail: string | null;
  temperature: number | null;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
  ph: number | null;
  gh: number | null;
  kh: number | null;
  status: string | null;
  notes: string | null;
}

export interface FishAquariumProductUsage {
  id: number;
  fishAquariumProductId: number;
  productName: string;
  productCategory: string;
  usedAt: string;
  usageType: string;
  quantityUsed: number | null;
  quantityAfter: number | null;
  percentLeftAfter: number | null;
  openedNewContainer: boolean;
  updateInventory: boolean;
  addToShoppingList: boolean;
  shoppingItemName: string;
  shoppingCategory: string;
  notes: string | null;
}

export interface FishAquariumProductUsageRequest {
  fishAquariumProductId: number;
  usedAt: string;
  usageType: string;
  quantityUsed: number | null;
  quantityAfter: number | null;
  percentLeftAfter: number | null;
  openedNewContainer: boolean;
  updateInventory: boolean;
  addToShoppingList: boolean;
  shoppingCategory: string | null;
  notes: string | null;
}

export interface ShoppingListItem {
  id: number;
  itemName: string;
  category: string;
  status: string;
  quantity: number | null;
  unit: string | null;
  sourceArea: string | null;
  sourceType: string | null;
  sourceId: number | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}
