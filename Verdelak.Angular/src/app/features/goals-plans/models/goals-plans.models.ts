export interface AnnualPlanSummary {
  id: number;
  year: number;
  title: string;
  status: string;
  sourceSystem: string | null;
  sourceFileName: string | null;
  importedAtUtc: string | null;
  itemCount: number;
  summaryCount: number;
  completeCount: number;
  noteCount: number;
}

export type AnnualPlanStatus = 'Active' | 'Archived' | 'Draft';

export interface AnnualPlanStatusUpdateRequest {
  status: AnnualPlanStatus;
}

export interface AnnualPlanCreateRequest {
  year: number;
  title: string | null;
}

export interface AnnualPlanRolloverRequest {
  sourcePlanId: number;
  year: number;
  title: string | null;
}

export interface AnnualPlanRolloverResult {
  plan: AnnualPlanSummary;
  rolledItemCount: number;
  rolledDependencyCount: number;
}

export interface AnnualPlanRolloverSectionPreview {
  section: string;
  itemCount: number;
}

export interface AnnualPlanRolloverPreview {
  sourcePlanId: number;
  sourceYear: number;
  targetYear: number;
  targetTitle: string;
  sourceItemCount: number;
  rolledItemCount: number;
  rolledWorkItemCount: number;
  rolledStructureItemCount: number;
  completedWorkItemCount: number;
  retainedDependencyCount: number;
  droppedDependencyCount: number;
  sections: AnnualPlanRolloverSectionPreview[];
}

export interface AnnualPlanArchiveComparisonMetric {
  metric: string;
  leftValue: number;
  rightValue: number;
  delta: number;
}

export interface AnnualPlanArchiveComparisonSection {
  section: string;
  leftLeafWorkCount: number;
  rightLeafWorkCount: number;
  leafWorkDelta: number;
  leftCompletedLeafWorkCount: number;
  rightCompletedLeafWorkCount: number;
  completedLeafWorkDelta: number;
  leftOpenLeafWorkCount: number;
  rightOpenLeafWorkCount: number;
  openLeafWorkDelta: number;
  leftCompletionPercent: number;
  rightCompletionPercent: number;
  completionPercentDelta: number;
}

export interface AnnualPlanArchiveComparison {
  leftPlan: AnnualPlanSummary;
  rightPlan: AnnualPlanSummary;
  metrics: AnnualPlanArchiveComparisonMetric[];
  sections: AnnualPlanArchiveComparisonSection[];
}

export interface PlanItem {
  id: number;
  parentPlanItemId: number | null;
  sortOrder: number;
  outlineLevel: number;
  itemType: string;
  title: string;
  topLevelSection: string | null;
  notes: string | null;
  percentComplete: number;
  isSummary: boolean;
  isMilestone: boolean;
  status: string;
  planningWindowType: string;
  targetStartDate: string | null;
  targetEndDate: string | null;
  scheduleSurfaceMode: string;
  rolloverPolicy: PlanItemRolloverPolicy;
  sourceManualSchedule: boolean;
  importedStart: string | null;
  importedFinish: string | null;
  importedDuration: string | null;
  importedPredecessorCount: number;
  unfinishedPredecessorCount: number;
}

export interface GoalSchedulePreviewItem {
  planItemId: number;
  title: string;
  topLevelSection: string | null;
  itemType: string;
  percentComplete: number;
  planningWindowType: string;
  targetStartDate: string | null;
  targetEndDate: string | null;
  scheduleSurfaceMode: string;
  surfaceReason: string;
}

export interface PlanItemUpdateRequest {
  title: string;
  itemType: string;
  percentComplete: number;
  notes: string | null;
  planningWindowType: string;
  targetStartDate: string | null;
  targetEndDate: string | null;
  scheduleSurfaceMode: string;
  rolloverPolicy: PlanItemRolloverPolicy;
}

export type PlanItemRolloverPolicy = 'Normal' | 'Never' | 'Always' | 'RepeatNextYear';

export interface PlanItemBulkCreateItem extends PlanItemUpdateRequest {
  title: string;
  outlineLevel?: number | null;
  outlineNumber?: string | null;
}

export interface PlanItemBulkCreateRequest {
  parentPlanItemId: number;
  items: PlanItemBulkCreateItem[];
}

export interface PlanItemDeleteResult {
  deletedCount: number;
}

export type PlanItemMovePlacement = 'LastChild' | 'Before' | 'After';

export interface PlanItemMoveRequest {
  parentPlanItemId: number;
  placement: PlanItemMovePlacement;
  referencePlanItemId: number | null;
}

export interface PlanItemMoveResult {
  movedCount: number;
}

export interface PlanItemDependency {
  id: number;
  planItemId: number;
  predecessorPlanItemId: number | null;
  predecessorSourceTaskUid: number | null;
  dependencyType: PlanItemDependencyType;
  lagMinutes: number;
  importedLinkType: string | null;
  importedLagFormat: number | null;
  title: string | null;
  topLevelSection: string | null;
  outlineLevel: number | null;
  itemType: string | null;
  status: string | null;
}

export interface PlanItemDependencies {
  planItemId: number;
  predecessors: PlanItemDependency[];
  successors: PlanItemDependency[];
}

export interface PlanItemDependencyCreateRequest {
  predecessorPlanItemId: number;
  dependencyType: PlanItemDependencyType;
  lagMinutes: number;
}

export type PlanItemDependencyType = 'FF' | 'FS' | 'SF' | 'SS';

export interface PlanItemDependencyUpdateRequest {
  dependencyType: PlanItemDependencyType;
  lagMinutes: number;
}

export interface ProjectXmlImportResult {
  plan: AnnualPlanSummary;
  importedTaskCount: number;
  importedNoteCount: number;
  importedManualTaskCount: number;
  importedPredecessorCount: number;
  skippedPredecessorCount: number;
  topLevelSections: string[];
}

export interface ProjectXmlRoundTripValidation {
  isValid: boolean;
  planCounts: ProjectXmlValidationCounts;
  exportedXmlCounts: ProjectXmlValidationCounts;
  mismatches: ProjectXmlValidationMismatch[];
}

export interface ProjectXmlValidationCounts {
  taskCount: number;
  noteCount: number;
  manualTaskCount: number;
  predecessorLinkCount: number;
  milestoneCount: number;
  nonZeroPercentCompleteCount: number;
}

export interface ProjectXmlValidationMismatch {
  field: string;
  expected: number;
  actual: number;
}
