import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AnnualPlanArchiveComparison,
  AnnualPlanArchiveComparisonMetric,
  AnnualPlanArchiveComparisonSection,
  AnnualPlanCreateRequest,
  AnnualPlanSummary,
  AnnualPlanRolloverPreview,
  AnnualPlanStatus,
  GoalSchedulePreviewItem,
  PlanItem,
  PlanItemBulkCreateItem,
  PlanItemBulkCreateRequest,
  PlanItemDependencies,
  PlanItemDependency,
  PlanItemDependencyType,
  PlanItemMoveRequest,
  PlanItemRolloverPolicy,
  PlanItemUpdateRequest,
  ProjectXmlRoundTripValidation
} from '../models/goals-plans.models';
import { GoalsPlansService } from '../goals-plans.service';
import { GoalsArchiveComparisonPanel } from '../goals-archive-comparison-panel/goals-archive-comparison-panel';
import { GoalsSchedulePreviewPanel } from '../goals-schedule-preview-panel/goals-schedule-preview-panel';
import { GoalsStagingPanel } from '../goals-staging-panel/goals-staging-panel';

type BrowserView = 'outline' | 'grid';
type WorkView = 'all' | 'active' | 'overdue' | 'unscheduled' | 'blocked';
type ActiveScope = 'today' | 'week' | 'month';
type PlanningWindowFilter = '' | 'Unscheduled' | 'Year' | 'Quarter' | 'Month' | 'Week' | 'Day' | 'DateRange';
type ScheduleSurfaceMode = 'Never' | 'ActiveGoalsOnly' | 'DuringTargetWindow' | 'NearTargetEnd' | 'PinnedToSchedule';
type StageColumnPreset = 'Auto' | 'SimpleList' | 'ProjectCsv' | 'QueueList' | 'Checklist' | 'Timeline';
type FutureBulkPreset = 'Books' | 'Shows' | 'Minis' | 'Software' | 'Custom';
type CsvCell = string | number | boolean | null | undefined;

interface PlanItemEdit {
  title: string;
  itemType: string;
  percentComplete: number;
  notes: string;
  planningWindowType: string;
  targetStartDate: string;
  targetEndDate: string;
  scheduleSurfaceMode: string;
  rolloverPolicy: PlanItemRolloverPolicy;
}

interface StagedPlanItem extends PlanItemBulkCreateItem {
  key: number;
  importWarnings?: string[];
}

interface StagedValidationEntry {
  severity: 'Error' | 'Warning';
  row: number;
  title: string;
  message: string;
}

interface StagedValidationCard {
  label: string;
  value: number;
  detail: string;
  tone: 'emerald' | 'amber' | 'red' | 'slate';
}

interface OutlineCreateItem extends PlanItemBulkCreateItem {
  parentId: number;
}

interface DependencyEdit {
  dependencyType: PlanItemDependencyType;
  lagMinutes: number;
}

interface FocusedReportGroup {
  section: string;
  items: PlanItem[];
  totalCount: number;
}

interface SectionSummary {
  section: string;
  totalCount: number;
  leafWorkCount: number;
  completedLeafWorkCount: number;
  inProgressCount: number;
  notStartedCount: number;
  openLeafWorkCount: number;
  activeCount: number;
  overdueCount: number;
  unscheduledCount: number;
  scheduledCount: number;
  blockedCount: number;
  queueCount: number;
  milestoneCount: number;
  notesCount: number;
  dependencyCount: number;
  averagePercentComplete: number;
  completionPercent: number;
}

interface YearProgressReport {
  totalCount: number;
  leafWorkCount: number;
  completedLeafWorkCount: number;
  inProgressCount: number;
  notStartedCount: number;
  openLeafWorkCount: number;
  averagePercentComplete: number;
  completionPercent: number;
  activeTodayCount: number;
  activeWeekCount: number;
  activeMonthCount: number;
  overdueCount: number;
  unscheduledCount: number;
  scheduledCount: number;
  blockedCount: number;
  milestoneCount: number;
  notesCount: number;
  dependencyCount: number;
  normalRolloverCount: number;
  neverRolloverCount: number;
  alwaysRolloverCount: number;
  repeatNextYearCount: number;
}

interface RolloverPolicyReport {
  policy: PlanItemRolloverPolicy;
  leafWorkCount: number;
  openLeafWorkCount: number;
  completedLeafWorkCount: number;
}

type StageColumn =
  'title'
  | 'itemType'
  | 'percentComplete'
  | 'notes'
  | 'planningWindowType'
  | 'targetStartDate'
  | 'targetEndDate'
  | 'scheduleSurfaceMode'
  | 'rolloverPolicy'
  | 'outlineLevel'
  | 'outlineNumber';

interface StageColumnOption {
  key: StageColumn;
  label: string;
}

interface StageMappingCard {
  label: string;
  value: number;
  detail: string;
}

interface StageDuplicateMapping {
  header: string;
  columns: string;
}

interface StageMappingPreviewRow {
  rowNumber: number;
  title: string;
  type: string;
  percent: string;
  window: string;
  start: string;
  end: string;
  schedule: string;
}

interface FutureBulkCard {
  label: string;
  value: number;
  detail: string;
  tone: 'blue' | 'emerald' | 'amber' | 'slate';
}

interface FutureBulkPreviewRow {
  row: number;
  title: string;
  section: string;
  itemType: string;
  planYear: number | null;
  status: string;
}

@Component({
  selector: 'app-goals-plans-browser',
  imports: [CommonModule, FormsModule, GoalsArchiveComparisonPanel, GoalsSchedulePreviewPanel, GoalsStagingPanel],
  templateUrl: './goals-plans-browser.html',
  styleUrl: './goals-plans-browser.scss'
})
export class GoalsPlansBrowser implements OnInit {
  readonly viewModel = this;
  readonly gridItemLimit = 250;
  readonly focusedItemLimit = 250;
  readonly focusedSectionItemLimit = 100;
  readonly editableItemTypes = ['Section', 'Project', 'Task', 'QueueItem', 'Milestone'];
  readonly planningWindowTypes = ['Unscheduled', 'Year', 'Quarter', 'Month', 'Week', 'Day', 'DateRange'];
  readonly scheduleSurfaceModes: ScheduleSurfaceMode[] = ['Never', 'ActiveGoalsOnly', 'DuringTargetWindow', 'NearTargetEnd', 'PinnedToSchedule'];
  readonly rolloverPolicies: PlanItemRolloverPolicy[] = ['Normal', 'Never', 'Always', 'RepeatNextYear'];
  readonly dependencyTypes: PlanItemDependencyType[] = ['FS', 'FF', 'SS', 'SF'];
  readonly annualPlanStatuses: AnnualPlanStatus[] = ['Draft', 'Active', 'Archived'];
  readonly quickProgressValues = [0, 25, 50, 75, 100];
  readonly stagingColumnOptions: StageColumnOption[] = [
    { key: 'title', label: 'Title' },
    { key: 'itemType', label: 'Type' },
    { key: 'percentComplete', label: 'Percent Complete' },
    { key: 'planningWindowType', label: 'Planning Window' },
    { key: 'targetStartDate', label: 'Start Date' },
    { key: 'targetEndDate', label: 'End Date' },
    { key: 'scheduleSurfaceMode', label: 'Schedule Mode' },
    { key: 'rolloverPolicy', label: 'Rollover Policy' },
    { key: 'outlineLevel', label: 'Outline Level' },
    { key: 'outlineNumber', label: 'WBS / Outline Number' },
    { key: 'notes', label: 'Notes' }
  ];
  readonly stagingColumnPresets: { value: StageColumnPreset; label: string }[] = [
    { value: 'Auto', label: 'Auto detect' },
    { value: 'SimpleList', label: 'Simple task list' },
    { value: 'ProjectCsv', label: 'MS Project CSV' },
    { value: 'QueueList', label: 'Queue list' },
    { value: 'Checklist', label: 'Checklist / done list' },
    { value: 'Timeline', label: 'Timeline / dates list' }
  ];
  readonly futureBulkPresets: { value: FutureBulkPreset; label: string; section: string }[] = [
    { value: 'Books', label: 'Books', section: 'Read' },
    { value: 'Shows', label: 'Shows', section: 'Watch' },
    { value: 'Minis', label: 'Miniatures', section: 'Minis' },
    { value: 'Software', label: 'Software', section: 'Video Games' },
    { value: 'Custom', label: 'Custom', section: 'Future Queue' }
  ];
  readonly plans = signal<AnnualPlanSummary[]>([]);
  readonly selectedPlanId = signal<number | null>(null);
  readonly items = signal<PlanItem[]>([]);
  readonly browserView = signal<BrowserView>('outline');
  readonly workView = signal<WorkView>('all');
  readonly activeScope = signal<ActiveScope>('today');
  readonly schedulePreviewScope = signal<ActiveScope>('week');
  readonly selectedOutlineItemId = signal<number | null>(null);
  readonly outlineEditorId = signal<number | null>(null);
  readonly outlineCreate = signal<OutlineCreateItem | null>(null);
  readonly outlineMoveItemId = signal<number | null>(null);
  readonly outlineMoveParentId = signal<number | null>(null);
  readonly outlineMoveSearch = signal('');
  readonly dependencies = signal<PlanItemDependencies | null>(null);
  readonly schedulePreview = signal<GoalSchedulePreviewItem[]>([]);
  readonly dependencySearch = signal('');
  readonly dependencyCandidateId = signal<number | null>(null);
  readonly dependencyCreateType = signal<PlanItemDependencyType>('FS');
  readonly dependencyCreateLagMinutes = signal(0);
  readonly dependencyEdits = signal<Record<number, DependencyEdit>>({});
  readonly stagingText = signal('');
  readonly stagedItems = signal<StagedPlanItem[]>([]);
  readonly stagingParentId = signal<number | null>(null);
  readonly stagingDefaultItemType = signal('Task');
  readonly futureBulkYear = signal<number | null>(new Date().getFullYear() + 1);
  readonly futureBulkTitle = signal('');
  readonly futureBulkPreset = signal<FutureBulkPreset>('Books');
  readonly futureBulkSection = signal('Read');
  readonly futureBulkText = signal('');
  readonly futurePlanCreating = signal(false);
  readonly stagingFileName = signal<string | null>(null);
  readonly stagingHeaders = signal<string[]>([]);
  readonly stagingRows = signal<string[][]>([]);
  readonly stagingColumnPreset = signal<StageColumnPreset>('Auto');
  readonly stagingColumnSelections = signal<Record<StageColumn, number | null>>(this.emptyStageColumnSelections());
  readonly stagingMappedColumnCount = computed(() => this.stagingColumnOptions
    .filter(option => this.stagingColumnSelections()[option.key] !== null)
    .length);
  readonly stagingDuplicateMappings = computed<StageDuplicateMapping[]>(() => {
    const headers = this.stagingHeaders();
    const mappedByIndex = new Map<number, string[]>();

    this.stagingColumnOptions.forEach(option => {
      const index = this.stagingColumnSelections()[option.key];
      if (index === null) {
        return;
      }

      mappedByIndex.set(index, [...(mappedByIndex.get(index) ?? []), option.label]);
    });

    return Array.from(mappedByIndex.entries())
      .filter(([, labels]) => labels.length > 1)
      .map(([index, labels]) => ({
        header: headers[index] || `Column ${index + 1}`,
        columns: labels.join(', ')
      }));
  });
  readonly stagingUnmappedHeaders = computed(() => {
    const headers = this.stagingHeaders();
    const mappedIndexes = new Set(Object.values(this.stagingColumnSelections())
      .filter((index): index is number => index !== null));

    return headers
      .map((header, index) => ({ header: header || `Column ${index + 1}`, index }))
      .filter(item => !mappedIndexes.has(item.index));
  });
  readonly stagingUnmappedHeaderPreview = computed(() => {
    const headers = this.stagingUnmappedHeaders().slice(0, 8).map(item => item.header).join(', ');
    return `${headers}${this.stagingUnmappedHeaders().length > 8 ? ', ...' : ''}`;
  });
  readonly stagingMappingCards = computed<StageMappingCard[]>(() => [
    {
      label: 'Mapped fields',
      value: this.stagingMappedColumnCount(),
      detail: `${this.stagingColumnOptions.length.toLocaleString()} supported fields`
    },
    {
      label: 'Rows ready',
      value: this.stagingRows().length,
      detail: 'Imported data rows available to restage'
    },
    {
      label: 'Duplicates',
      value: this.stagingDuplicateMappings().length,
      detail: 'Headers mapped to multiple fields'
    },
    {
      label: 'Unmapped headers',
      value: this.stagingUnmappedHeaders().length,
      detail: 'Columns left unused'
    }
  ]);
  readonly stagingMappingPreviewRows = computed<StageMappingPreviewRow[]>(() => {
    const columnMap = this.columnMapFromSelection(this.stagingColumnSelections());
    return this.stagingRows().slice(0, 5).map((row, index) => ({
      rowNumber: index + 2,
      title: this.csvValue(row, columnMap, 'title') || '-',
      type: this.csvValue(row, columnMap, 'itemType') || this.stagingDefaultItemType(),
      percent: this.csvValue(row, columnMap, 'percentComplete') || '0',
      window: this.csvValue(row, columnMap, 'planningWindowType') || 'Unscheduled',
      start: this.csvValue(row, columnMap, 'targetStartDate') || '-',
      end: this.csvValue(row, columnMap, 'targetEndDate') || '-',
      schedule: this.csvValue(row, columnMap, 'scheduleSurfaceMode') || 'Never'
    }));
  });
  readonly stagingBulkItemType = signal('');
  readonly stagingBulkPercent = signal<number | null>(null);
  readonly stagingBulkPlanningWindow = signal('');
  readonly stagingBulkStartDate = signal('');
  readonly stagingBulkEndDate = signal('');
  readonly stagingBulkScheduleMode = signal('');
  readonly stagingBulkRolloverPolicy = signal('');
  readonly massSelectedIds = signal<Set<number>>(new Set<number>());
  readonly massEditing = signal(false);
  readonly massPercent = signal<number | null>(null);
  readonly massPlanningWindow = signal('');
  readonly massStartDate = signal('');
  readonly massEndDate = signal('');
  readonly massScheduleMode = signal('');
  readonly massRolloverPolicy = signal('');
  readonly section = signal('');
  readonly search = signal('');
  readonly itemType = signal('');
  readonly planningWindow = signal<PlanningWindowFilter>('');
  readonly scheduleMode = signal('');
  readonly incompleteOnly = signal(false);
  readonly leafWorkOnly = signal(false);
  readonly collapsedIds = signal<Set<number>>(new Set<number>());
  readonly edits = signal<Record<number, PlanItemEdit>>({});
  readonly savingIds = signal<Set<number>>(new Set<number>());
  readonly rowErrors = signal<Record<number, string>>({});
  readonly importYear = signal<number | null>(new Date().getFullYear());
  readonly rolloverYear = signal<number | null>(new Date().getFullYear() + 1);
  readonly rolloverTitle = signal('');
  readonly rolloverPreview = signal<AnnualPlanRolloverPreview | null>(null);
  readonly archiveCompareLeftPlanId = signal<number | null>(null);
  readonly archiveCompareRightPlanId = signal<number | null>(null);
  readonly archiveComparison = signal<AnnualPlanArchiveComparison | null>(null);
  readonly replaceExisting = signal(false);
  readonly file = signal<File | null>(null);
  readonly loading = signal(false);
  readonly importing = signal(false);
  readonly exporting = signal(false);
  readonly validatingProjectXml = signal(false);
  readonly schedulePreviewLoading = signal(false);
  readonly bulkAdding = signal(false);
  readonly outlineSaving = signal(false);
  readonly outlineMoving = signal(false);
  readonly dependencyLoading = signal(false);
  readonly dependencySaving = signal(false);
  readonly planStatusSaving = signal(false);
  readonly rolloverPreviewing = signal(false);
  readonly rolloverSaving = signal(false);
  readonly archiveComparisonLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly projectXmlValidation = signal<ProjectXmlRoundTripValidation | null>(null);

  readonly selectedPlan = computed(() => this.plans().find(plan => plan.id === this.selectedPlanId()) ?? null);
  readonly selectedPlanArchived = computed(() => this.selectedPlan()?.status === 'Archived');
  readonly workingPlans = computed(() => this.plans().filter(plan => plan.status !== 'Archived'));
  readonly archivedPlans = computed(() => this.plans().filter(plan => plan.status === 'Archived'));
  readonly futureBulkPlan = computed(() => {
    const year = Number(this.futureBulkYear());
    return Number.isInteger(year)
      ? this.plans().find(plan => plan.year === year) ?? null
      : null;
  });
  readonly selectedFutureBulkPlan = computed(() => this.selectedPlan()?.year === this.futureBulkYear());
  readonly futureBulkLines = computed(() => this.futureBulkText()
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean));
  readonly futureBulkDuplicateTitles = computed(() => {
    const counts = new Map<string, number>();
    this.futureBulkLines().forEach(title => {
      const normalized = title.toLocaleLowerCase();
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    });

    return this.futureBulkLines()
      .filter((title, index, lines) => (counts.get(title.toLocaleLowerCase()) ?? 0) > 1
        && lines.findIndex(item => item.toLocaleLowerCase() === title.toLocaleLowerCase()) === index);
  });
  readonly futureBulkExistingSection = computed(() => {
    const section = this.futureBulkSection().trim();
    if (!section) {
      return null;
    }

    return this.items().find(item => item.outlineLevel === 1 && item.title.trim().toLocaleLowerCase() === section.toLocaleLowerCase()) ?? null;
  });
  readonly futureBulkPreviewRows = computed<FutureBulkPreviewRow[]>(() => {
    const section = this.futureBulkSection().trim();
    const year = this.futureBulkYear();
    const selected = this.selectedFutureBulkPlan();
    const duplicates = new Set(this.futureBulkDuplicateTitles().map(title => title.toLocaleLowerCase()));

    return this.futureBulkLines().slice(0, 12).map((title, index) => ({
      row: index + 1,
      title,
      section: section || '(no section)',
      itemType: 'QueueItem',
      planYear: year,
      status: !selected ? 'Select year first' : duplicates.has(title.toLocaleLowerCase()) ? 'Duplicate title' : 'Ready'
    }));
  });
  readonly futureBulkCards = computed<FutureBulkCard[]>(() => [
    {
      label: 'Future rows',
      value: this.futureBulkLines().length,
      detail: 'Pasted item titles',
      tone: this.futureBulkLines().length ? 'blue' : 'slate'
    },
    {
      label: 'Duplicates',
      value: this.futureBulkDuplicateTitles().length,
      detail: 'Repeated pasted titles',
      tone: this.futureBulkDuplicateTitles().length ? 'amber' : 'emerald'
    },
    {
      label: 'Plan status',
      value: this.futureBulkPlan() ? 1 : 0,
      detail: this.selectedFutureBulkPlan() ? 'Future year selected' : this.futureBulkPlan() ? 'Plan exists, not selected' : 'Draft year missing',
      tone: this.selectedFutureBulkPlan() ? 'emerald' : this.futureBulkPlan() ? 'amber' : 'slate'
    },
    {
      label: 'Section',
      value: this.futureBulkExistingSection() ? 1 : 0,
      detail: this.futureBulkExistingSection() ? 'Existing section will be reused' : 'New section will be staged',
      tone: this.futureBulkExistingSection() ? 'emerald' : 'blue'
    }
  ]);
  readonly importYearArchived = computed(() => this.plans()
    .some(plan => plan.year === this.importYear() && plan.status === 'Archived'));
  readonly rolloverYearExists = computed(() => this.plans()
    .some(plan => plan.year === this.rolloverYear()));
  readonly rolloverPreviewCurrent = computed(() => {
    const preview = this.rolloverPreview();
    return !!preview
      && preview.sourcePlanId === this.selectedPlanId()
      && preview.targetYear === this.rolloverYear();
  });
  readonly sections = computed(() => [...new Set(this.items()
    .map(item => item.topLevelSection)
    .filter((value): value is string => !!value))]
    .sort((left, right) => left.localeCompare(right)));
  readonly itemTypes = computed(() => [...new Set(this.items().map(item => item.itemType))]
    .sort((left, right) => left.localeCompare(right)));
  readonly stagingParents = computed(() => this.items()
    .filter(item => item.isSummary || item.outlineLevel === 0 || item.itemType === 'Section' || item.itemType === 'Project')
    .sort((left, right) => left.sortOrder - right.sortOrder));
  readonly stagedValidation = computed(() => this.validateStagedItems());
  readonly stagedErrors = computed(() => this.stagedValidation().filter(item => item.severity === 'Error'));
  readonly stagedWarnings = computed(() => this.stagedValidation().filter(item => item.severity === 'Warning'));
  readonly stagedRowsWithValidation = computed(() => new Set(this.stagedValidation()
    .filter(entry => entry.row > 0)
    .map(entry => entry.row)));
  readonly stagedValidationCards = computed<StagedValidationCard[]>(() => {
    const errors = this.stagedErrors().length;
    const warnings = this.stagedWarnings().length;
    const rowsWithValidation = this.stagedRowsWithValidation().size;
    const cleanRows = Math.max(0, this.stagedItems().length - rowsWithValidation);

    return [
      {
        label: 'Commit status',
        value: errors,
        detail: errors ? 'Errors must be fixed before commit' : warnings ? 'Warnings need confirmation' : 'Ready to commit',
        tone: errors ? 'red' : warnings ? 'amber' : 'emerald'
      },
      {
        label: 'Errors',
        value: errors,
        detail: 'Blocking validation issues',
        tone: errors ? 'red' : 'slate'
      },
      {
        label: 'Warnings',
        value: warnings,
        detail: 'Confirmation required before commit',
        tone: warnings ? 'amber' : 'slate'
      },
      {
        label: 'Clean rows',
        value: cleanRows,
        detail: 'Rows without validation findings',
        tone: cleanRows ? 'emerald' : 'slate'
      }
    ];
  });
  readonly childrenByParent = computed(() => {
    const children = new Map<number, PlanItem[]>();

    for (const item of this.items()) {
      if (!item.parentPlanItemId) {
        continue;
      }

      const siblings = children.get(item.parentPlanItemId) ?? [];
      siblings.push(item);
      children.set(item.parentPlanItemId, siblings);
    }

    return children;
  });
  readonly itemById = computed(() => new Map(this.items().map(item => [item.id, item])));
  readonly selectedOutlineItem = computed(() => {
    const id = this.selectedOutlineItemId();
    return id ? this.itemById().get(id) ?? null : null;
  });
  readonly dependencyCandidates = computed(() => {
    const selected = this.selectedOutlineItem();
    const search = this.dependencySearch().trim().toLocaleLowerCase();
    if (!selected) {
      return [];
    }

    return this.items()
      .filter(item => item.outlineLevel > 0 && item.id !== selected.id)
      .filter(item => search
        ? this.outlinePathLabel(item).toLocaleLowerCase().includes(search)
        : item.topLevelSection === selected.topLevelSection)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  });
  readonly activeItems = computed(() => this.items().filter(item => this.isActiveItem(item)));
  readonly overdueItems = computed(() => this.items().filter(item => this.isOverdueItem(item)));
  readonly unscheduledItems = computed(() => this.items().filter(item => this.isUnscheduledItem(item)));
  readonly blockedItems = computed(() => this.items().filter(item => this.isBlockedItem(item)));
  readonly openLeafWorkItems = computed(() => this.items().filter(item => this.isOpenLeafWorkItem(item)));
  readonly sectionSummaries = computed(() => this.summarizeSections());
  readonly yearProgressReport = computed(() => this.summarizeYear());
  readonly rolloverPolicyReport = computed(() => this.summarizeRolloverPolicies());
  readonly dashboardCompletePercent = computed(() => {
    const totalLeafWork = this.items().filter(item => this.isLeafWorkItem(item)).length;
    const completedLeafWork = this.items().filter(item => this.isLeafWorkItem(item) && item.percentComplete >= 100).length;
    return totalLeafWork === 0 ? 0 : Math.round((completedLeafWork / totalLeafWork) * 100);
  });
  readonly filteredItems = computed(() => {
    const items = this.items();
    const section = this.section();
    const search = this.search().trim().toLocaleLowerCase();
    const itemType = this.itemType();
    const planningWindow = this.planningWindow();
    const scheduleMode = this.scheduleMode();
    const incompleteOnly = this.incompleteOnly();
    const leafWorkOnly = this.leafWorkOnly();
    const workView = this.workView();

    return items.filter(item => {
      const matchesSection = !section || item.topLevelSection === section;
      const matchesSearch = !search
        || item.title.toLocaleLowerCase().includes(search)
        || item.notes?.toLocaleLowerCase().includes(search);
      const matchesType = !itemType || item.itemType === itemType;
      const matchesPlanningWindow = !planningWindow || item.planningWindowType === planningWindow;
      const matchesScheduleMode = !scheduleMode || item.scheduleSurfaceMode === scheduleMode;
      const matchesProgress = !incompleteOnly || item.percentComplete < 100;
      const matchesLeafWork = !leafWorkOnly || this.isLeafWorkItem(item);
      const matchesWorkView = workView === 'active'
        ? this.isActiveItem(item, this.activeScope())
        : workView === 'overdue'
          ? this.isOverdueItem(item)
          : workView === 'unscheduled'
            ? this.isUnscheduledItem(item)
            : workView === 'blocked'
              ? this.isBlockedItem(item)
              : true;

      return matchesSection
        && matchesSearch
        && matchesType
        && matchesPlanningWindow
        && matchesScheduleMode
        && matchesProgress
        && matchesLeafWork
        && matchesWorkView;
    });
  });
  readonly focusedItems = computed(() => this.filteredItems()
    .filter(item => this.isOpenLeafWorkItem(item))
    .sort((left, right) => this.compareFocusedItems(left, right)));
  readonly focusedReportItems = computed(() => this.focusedItems().slice(0, this.focusedItemLimit));
  readonly focusedReportGroups = computed(() => this.groupFocusedReportItems());
  readonly hasTruncatedFocusedGroups = computed(() => this.focusedReportGroups()
    .some(group => group.items.length < group.totalCount));
  readonly gridItems = computed(() => this.filteredItems().slice(0, this.gridItemLimit));
  readonly massEditableQueueItems = computed(() => this.filteredItems()
    .filter(item => item.itemType === 'QueueItem' && item.outlineLevel > 0 && !item.isSummary));
  readonly massSelectedItems = computed(() => {
    const selectedIds = this.massSelectedIds();
    return this.massEditableQueueItems().filter(item => selectedIds.has(item.id));
  });
  readonly massVisibleQueueItems = computed(() => this.gridItems()
    .filter(item => item.itemType === 'QueueItem' && item.outlineLevel > 0 && !item.isSummary));
  readonly massSelectedCount = computed(() => this.massSelectedItems().length);
  readonly massSelectionLabel = computed(() => {
    const selected = this.massSelectedCount();
    const eligible = this.massEditableQueueItems().length;
    return `${selected.toLocaleString()} selected / ${eligible.toLocaleString()} queue rows in filter`;
  });
  readonly visibleItems = computed(() => {
    const items = this.items();
    const filteredItems = this.filteredItems();
    const search = this.search().trim().toLocaleLowerCase();
    const itemType = this.itemType();
    const planningWindow = this.planningWindow();
    const scheduleMode = this.scheduleMode();
    const incompleteOnly = this.incompleteOnly();
    const leafWorkOnly = this.leafWorkOnly();
    const workView = this.workView();
    const collapsedIds = this.collapsedIds();
    const itemById = this.itemById();
    const hasFocusedFilter = !!search || !!itemType || !!planningWindow || !!scheduleMode || incompleteOnly || leafWorkOnly || workView !== 'all';
    const contextIds = new Set<number>();

    for (const item of filteredItems) {
      contextIds.add(item.id);
      this.addAncestors(item, itemById, contextIds);
    }

    return items.filter(item => {
      if (!contextIds.has(item.id)) {
        return false;
      }

      return hasFocusedFilter || !this.hasCollapsedAncestor(item, itemById, collapsedIds);
    });
  });
  private nextStagedKey = 1;

  constructor(private readonly service: GoalsPlansService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(preferredPlanId?: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getPlans().subscribe({
      next: plans => {
        this.plans.set(plans);
        this.ensureArchiveComparisonDefaults(plans);
        const activePlanId = plans.find(plan => plan.status === 'Active')?.id ?? null;
        const selectedId = preferredPlanId ?? this.selectedPlanId() ?? activePlanId ?? plans[0]?.id ?? null;
        this.selectedPlanId.set(selectedId);

        if (selectedId) {
          const selectedPlan = plans.find(plan => plan.id === selectedId);
          if (selectedPlan) {
            this.rolloverYear.set(selectedPlan.year + 1);
          }

          this.loadPlanItems(selectedId);
        } else {
          this.items.set([]);
          this.loading.set(false);
        }
      },
      error: err => {
        this.error.set(this.errorText(err, 'Failed to load annual plans.'));
        this.loading.set(false);
      }
    });
  }

  selectPlan(planId: number | null): void {
    this.selectedPlanId.set(planId);
    this.rolloverPreview.set(null);
    this.section.set('');
    this.search.set('');
    this.itemType.set('');
    this.planningWindow.set('');
    this.scheduleMode.set('');
    this.incompleteOnly.set(false);
    this.leafWorkOnly.set(false);
    this.workView.set('all');
    this.activeScope.set('today');
    this.schedulePreviewScope.set('week');

    if (planId) {
      const plan = this.plans().find(item => item.id === planId);
      if (plan) {
        this.rolloverYear.set(plan.year + 1);
      }

      this.loadPlanItems(planId);
    } else {
      this.items.set([]);
      this.schedulePreview.set([]);
    }
  }

  updateSelectedPlanStatus(status: AnnualPlanStatus): void {
    const plan = this.selectedPlan();
    if (!plan || plan.status === status) {
      return;
    }

    const action = status === 'Active'
      ? `Make ${plan.year} the active Goals year?`
      : status === 'Archived'
        ? `Mark ${plan.year} as archived?`
        : `Mark ${plan.year} as draft?`;
    if (!window.confirm(action)) {
      return;
    }

    this.planStatusSaving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updatePlanStatus(plan.id, { status }).subscribe({
      next: updated => {
        this.message.set(`${updated.year} is ${updated.status.toLocaleLowerCase()}.`);
        this.loadPlans(updated.id);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to update annual plan status.')),
      complete: () => this.planStatusSaving.set(false)
    });
  }

  createRollover(): void {
    const sourcePlan = this.selectedPlan();
    const year = this.rolloverYear();
    if (!sourcePlan || !year) {
      this.error.set('Choose a source year and a new plan year.');
      return;
    }

    if (this.rolloverYearExists()) {
      this.error.set(`An annual plan already exists for ${year}.`);
      return;
    }

    if (!this.rolloverPreviewCurrent()) {
      this.error.set('Preview this rollover before creating the draft year.');
      return;
    }

    if (!window.confirm(`Create ${year} as a draft rollover from ${sourcePlan.year}?`)) {
      return;
    }

    this.rolloverSaving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.rolloverPlan({
      sourcePlanId: sourcePlan.id,
      year,
      title: this.rolloverTitle().trim() || null
    }).subscribe({
      next: result => {
        this.message.set(`${result.plan.year} draft created with ${result.rolledItemCount.toLocaleString()} rolled items and ${result.rolledDependencyCount.toLocaleString()} dependencies.`);
        this.rolloverTitle.set('');
        this.loadPlans(result.plan.id);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to create the rollover year.')),
      complete: () => this.rolloverSaving.set(false)
    });
  }

  previewRollover(): void {
    const sourcePlan = this.selectedPlan();
    const year = this.rolloverYear();
    if (!sourcePlan || !year) {
      this.error.set('Choose a source year and a new plan year.');
      return;
    }

    if (this.rolloverYearExists()) {
      this.error.set(`An annual plan already exists for ${year}.`);
      return;
    }

    this.rolloverPreviewing.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.previewRollover({
      sourcePlanId: sourcePlan.id,
      year,
      title: this.rolloverTitle().trim() || null
    }).subscribe({
      next: preview => this.rolloverPreview.set(preview),
      error: err => {
        this.rolloverPreview.set(null);
        this.error.set(this.errorText(err, 'Failed to preview the rollover year.'));
      },
      complete: () => this.rolloverPreviewing.set(false)
    });
  }

  setRolloverYear(year: number | null): void {
    this.rolloverYear.set(year);
    this.rolloverPreview.set(null);
  }

  setRolloverTitle(title: string): void {
    this.rolloverTitle.set(title);
    this.rolloverPreview.set(null);
  }

  setFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  importFile(): void {
    if (this.importYearArchived()) {
      this.error.set('Archived annual plans cannot be replaced. Mark that year as draft or active first.');
      return;
    }

    const file = this.file();
    if (!file) {
      this.error.set('Choose a Project XML file first.');
      return;
    }

    this.importing.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.importProjectXml(file, this.importYear(), this.replaceExisting()).subscribe({
      next: result => {
        const skippedLinks = result.skippedPredecessorCount
          ? ` ${result.skippedPredecessorCount.toLocaleString()} predecessor link${result.skippedPredecessorCount === 1 ? '' : 's'} skipped.`
          : '';
        this.message.set(`${result.plan.title} imported with ${result.importedTaskCount.toLocaleString()} tasks, ${result.importedPredecessorCount.toLocaleString()} predecessor links, ${result.importedNoteCount.toLocaleString()} notes, and ${result.importedManualTaskCount.toLocaleString()} manual tasks.${skippedLinks}`);
        this.file.set(null);
        this.loadPlans(result.plan.id);
      },
      error: err => {
        this.error.set(this.errorText(err, 'Failed to import Project XML.'));
        this.importing.set(false);
      },
      complete: () => this.importing.set(false)
    });
  }

  exportProjectXml(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      this.error.set('Choose an annual plan to export.');
      return;
    }

    this.exporting.set(true);
    this.error.set(null);
    this.service.exportProjectXml(plan.id).subscribe({
      next: xml => {
        const url = URL.createObjectURL(xml);
        const link = document.createElement('a');
        link.href = url;
        link.download = `goals-and-plans-${plan.year}.xml`;
        link.click();
        URL.revokeObjectURL(url);
        this.message.set(`${plan.year} exported as Microsoft Project XML.`);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to export Project XML.')),
      complete: () => this.exporting.set(false)
    });
  }

  validateProjectXmlRoundTrip(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      this.error.set('Choose an annual plan to validate.');
      return;
    }

    this.validatingProjectXml.set(true);
    this.error.set(null);
    this.projectXmlValidation.set(null);
    this.service.validateProjectXmlRoundTrip(plan.id).subscribe({
      next: result => {
        this.projectXmlValidation.set(result);
        this.message.set(result.isValid
          ? `${plan.year} Project XML round-trip validation passed.`
          : `${plan.year} Project XML round-trip validation found ${result.mismatches.length.toLocaleString()} mismatch${result.mismatches.length === 1 ? '' : 'es'}.`);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to validate Project XML round trip.')),
      complete: () => this.validatingProjectXml.set(false)
    });
  }

  validationCountEntries(result: ProjectXmlRoundTripValidation): { label: string; plan: number; exported: number }[] {
    return [
      { label: 'Tasks', plan: result.planCounts.taskCount, exported: result.exportedXmlCounts.taskCount },
      { label: 'Notes', plan: result.planCounts.noteCount, exported: result.exportedXmlCounts.noteCount },
      { label: 'Manual tasks', plan: result.planCounts.manualTaskCount, exported: result.exportedXmlCounts.manualTaskCount },
      { label: 'Predecessor links', plan: result.planCounts.predecessorLinkCount, exported: result.exportedXmlCounts.predecessorLinkCount },
      { label: 'Milestones', plan: result.planCounts.milestoneCount, exported: result.exportedXmlCounts.milestoneCount },
      { label: 'Progress', plan: result.planCounts.nonZeroPercentCompleteCount, exported: result.exportedXmlCounts.nonZeroPercentCompleteCount }
    ];
  }

  loadArchiveComparison(): void {
    const leftPlanId = this.archiveCompareLeftPlanId();
    const rightPlanId = this.archiveCompareRightPlanId();
    if (!leftPlanId || !rightPlanId) {
      this.error.set('Choose two archived years to compare.');
      return;
    }

    if (leftPlanId === rightPlanId) {
      this.error.set('Choose two different archived years to compare.');
      return;
    }

    this.archiveComparisonLoading.set(true);
    this.error.set(null);
    this.service.compareArchivedPlans(leftPlanId, rightPlanId).subscribe({
      next: comparison => {
        this.archiveComparison.set(comparison);
        this.message.set(`${comparison.leftPlan.year} and ${comparison.rightPlan.year} archive comparison loaded.`);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to load archived-year comparison.')),
      complete: () => this.archiveComparisonLoading.set(false)
    });
  }

  archiveMetricTone(metric: AnnualPlanArchiveComparisonMetric): string {
    if (metric.delta === 0) {
      return 'text-slate-600';
    }

    return metric.delta > 0 ? 'text-emerald-700' : 'text-rose-700';
  }

  archiveSectionTone(section: AnnualPlanArchiveComparisonSection): string {
    if (section.completionPercentDelta === 0) {
      return 'text-slate-600';
    }

    return section.completionPercentDelta > 0 ? 'text-emerald-700' : 'text-rose-700';
  }

  downloadArchiveComparisonReport(): void {
    const comparison = this.archiveComparison();
    if (!comparison) {
      this.error.set('Load an archived-year comparison before exporting.');
      return;
    }

    this.downloadCsv(`goals-${comparison.leftPlan.year}-vs-${comparison.rightPlan.year}-archive-comparison.csv`, [
      ['Metric', `${comparison.leftPlan.year}`, `${comparison.rightPlan.year}`, 'Delta'],
      ...comparison.metrics.map(metric => [metric.metric, metric.leftValue, metric.rightValue, metric.delta]),
      [],
      ['Section', `${comparison.leftPlan.year} Leaf Work`, `${comparison.rightPlan.year} Leaf Work`, 'Leaf Delta', `${comparison.leftPlan.year} Complete`, `${comparison.rightPlan.year} Complete`, 'Complete Delta', `${comparison.leftPlan.year} Open`, `${comparison.rightPlan.year} Open`, 'Open Delta', `${comparison.leftPlan.year} Completion %`, `${comparison.rightPlan.year} Completion %`, 'Completion Delta'],
      ...comparison.sections.map(section => [
        section.section,
        section.leftLeafWorkCount,
        section.rightLeafWorkCount,
        section.leafWorkDelta,
        section.leftCompletedLeafWorkCount,
        section.rightCompletedLeafWorkCount,
        section.completedLeafWorkDelta,
        section.leftOpenLeafWorkCount,
        section.rightOpenLeafWorkCount,
        section.openLeafWorkDelta,
        section.leftCompletionPercent,
        section.rightCompletionPercent,
        section.completionPercentDelta
      ])
    ]);
    this.message.set(`${comparison.leftPlan.year} vs ${comparison.rightPlan.year} archive comparison downloaded.`);
  }

  yearReportEntries(report: YearProgressReport): { label: string; value: number; tone: string; suffix?: string }[] {
    return [
      { label: 'Completion', value: report.completionPercent, tone: 'emerald', suffix: '%' },
      { label: 'Average progress', value: report.averagePercentComplete, tone: 'blue', suffix: '%' },
      { label: 'Open work', value: report.openLeafWorkCount, tone: 'slate' },
      { label: 'In progress', value: report.inProgressCount, tone: 'blue' },
      { label: 'Overdue', value: report.overdueCount, tone: 'rose' },
      { label: 'Blocked', value: report.blockedCount, tone: 'amber' },
      { label: 'Unscheduled', value: report.unscheduledCount, tone: 'cyan' },
      { label: 'Milestones', value: report.milestoneCount, tone: 'slate' }
    ];
  }

  sectionProgressTrack(summary: SectionSummary): string {
    return `linear-gradient(to right, #10b981 ${summary.completionPercent}%, #e2e8f0 ${summary.completionPercent}%)`;
  }

  sectionReportId(section: string): string {
    return `section-report-${section.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-') || 'root'}`;
  }

  jumpToSectionReport(section: string): void {
    document.getElementById(this.sectionReportId(section))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  downloadYearProgressReport(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      this.error.set('Choose an annual plan before exporting a report.');
      return;
    }

    const report = this.yearProgressReport();
    this.downloadCsv(`goals-${plan.year}-year-progress.csv`, [
      ['Metric', 'Value'],
      ['Year', plan.year],
      ['Title', plan.title],
      ['Status', plan.status],
      ['Outline items', report.totalCount],
      ['Leaf work', report.leafWorkCount],
      ['Complete leaf work', report.completedLeafWorkCount],
      ['Open leaf work', report.openLeafWorkCount],
      ['Completion percent', report.completionPercent],
      ['Average percent complete', report.averagePercentComplete],
      ['Not started', report.notStartedCount],
      ['In progress', report.inProgressCount],
      ['Active today', report.activeTodayCount],
      ['Active this week', report.activeWeekCount],
      ['Active this month', report.activeMonthCount],
      ['Overdue', report.overdueCount],
      ['Unscheduled', report.unscheduledCount],
      ['Scheduled', report.scheduledCount],
      ['Blocked', report.blockedCount],
      ['Milestones', report.milestoneCount],
      ['Notes', report.notesCount],
      ['Dependencies', report.dependencyCount],
      ['Normal rollover', report.normalRolloverCount],
      ['Never rollover', report.neverRolloverCount],
      ['Always rollover', report.alwaysRolloverCount],
      ['Repeat next year rollover', report.repeatNextYearCount]
    ]);
    this.message.set(`${plan.year} year progress report downloaded.`);
  }

  downloadSectionProgressReport(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      this.error.set('Choose an annual plan before exporting a report.');
      return;
    }

    this.downloadCsv(`goals-${plan.year}-section-progress.csv`, [
      [
        'Section',
        'CompletionPercent',
        'AveragePercentComplete',
        'OutlineItems',
        'LeafWork',
        'Complete',
        'Open',
        'InProgress',
        'NotStarted',
        'ActiveToday',
        'Overdue',
        'Scheduled',
        'Unscheduled',
        'Blocked',
        'Queue',
        'Milestones',
        'Notes',
        'Dependencies'
      ],
      ...this.sectionSummaries().map(summary => [
        summary.section,
        summary.completionPercent,
        summary.averagePercentComplete,
        summary.totalCount,
        summary.leafWorkCount,
        summary.completedLeafWorkCount,
        summary.openLeafWorkCount,
        summary.inProgressCount,
        summary.notStartedCount,
        summary.activeCount,
        summary.overdueCount,
        summary.scheduledCount,
        summary.unscheduledCount,
        summary.blockedCount,
        summary.queueCount,
        summary.milestoneCount,
        summary.notesCount,
        summary.dependencyCount
      ])
    ]);
    this.message.set(`${plan.year} section progress report downloaded.`);
  }

  downloadRolloverPolicyReport(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      this.error.set('Choose an annual plan before exporting a report.');
      return;
    }

    this.downloadCsv(`goals-${plan.year}-rollover-policy.csv`, [
      ['Policy', 'LeafWork', 'Open', 'Complete'],
      ...this.rolloverPolicyReport().map(item => [
        item.policy,
        item.leafWorkCount,
        item.openLeafWorkCount,
        item.completedLeafWorkCount
      ])
    ]);
    this.message.set(`${plan.year} rollover policy report downloaded.`);
  }

  downloadFocusedTaskReport(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      this.error.set('Choose an annual plan before exporting a report.');
      return;
    }

    const reportName = this.workView() === 'all' ? 'filtered' : this.workView();
    this.downloadCsv(`goals-${plan.year}-${reportName}-tasks.csv`, [
      [
        'Section',
        'Path',
        'Title',
        'Type',
        'PercentComplete',
        'Status',
        'PlanningWindow',
        'TargetStart',
        'TargetEnd',
        'ScheduleMode',
        'RolloverPolicy',
        'Predecessors',
        'UnfinishedPredecessors',
        'Notes'
      ],
      ...this.focusedItems().map(item => [
        item.topLevelSection ?? 'Plan root',
        this.outlinePathLabel(item),
        item.title,
        item.itemType,
        item.percentComplete,
        item.status,
        item.planningWindowType,
        this.dateInputValue(item.targetStartDate),
        this.dateInputValue(item.targetEndDate),
        this.scheduleModeLabel(item.scheduleSurfaceMode),
        item.rolloverPolicy,
        item.importedPredecessorCount,
        item.unfinishedPredecessorCount,
        item.notes ?? ''
      ])
    ]);
    this.message.set(`${plan.year} ${reportName} task report downloaded.`);
  }

  hasChildren(item: PlanItem): boolean {
    return !!this.childrenByParent().get(item.id)?.length;
  }

  isCollapsed(item: PlanItem): boolean {
    return this.collapsedIds().has(item.id);
  }

  toggleBranch(item: PlanItem): void {
    if (!this.hasChildren(item)) {
      return;
    }

    const next = new Set(this.collapsedIds());
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }

    this.collapsedIds.set(next);
  }

  expandAll(): void {
    this.collapsedIds.set(new Set<number>());
  }

  collapseAll(): void {
    this.collapsedIds.set(this.defaultCollapsedIds(this.items()));
  }

  openOutlineEdit(item: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    this.selectOutlineItem(item);
    this.outlineCreate.set(null);
    this.closeOutlineMove();
    this.outlineEditorId.set(item.id);
    this.clearRowError(item.id);
  }

  editingOutlineItem(): PlanItem | null {
    const id = this.outlineEditorId();
    return id ? this.itemById().get(id) ?? null : null;
  }

  closeOutlineEdit(): void {
    this.outlineEditorId.set(null);
  }

  openOutlineCreate(parent: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    this.selectOutlineItem(parent);
    this.outlineEditorId.set(null);
    this.closeOutlineMove();
    this.outlineCreate.set({
      parentId: parent.id,
      title: '',
      itemType: this.defaultChildType(parent),
      percentComplete: 0,
      notes: null,
      planningWindowType: 'Unscheduled',
      targetStartDate: null,
      targetEndDate: null,
      scheduleSurfaceMode: 'Never',
      rolloverPolicy: 'Normal'
    });
  }

  outlineCreateParent(): PlanItem | null {
    const form = this.outlineCreate();
    return form ? this.itemById().get(form.parentId) ?? null : null;
  }

  updateOutlineCreate(patch: Partial<OutlineCreateItem>): void {
    this.outlineCreate.update(form => form ? { ...form, ...patch } : form);
  }

  updateOutlineCreatePercent(value: number | string): void {
    this.updateOutlineCreate({ percentComplete: Number(value) });
  }

  closeOutlineCreate(): void {
    this.outlineCreate.set(null);
  }

  openOutlineMove(item: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    this.selectOutlineItem(item);
    this.outlineCreate.set(null);
    this.outlineEditorId.set(null);
    this.outlineMoveItemId.set(item.id);
    this.outlineMoveParentId.set(item.parentPlanItemId);
    this.outlineMoveSearch.set('');
  }

  movingOutlineItem(): PlanItem | null {
    const id = this.outlineMoveItemId();
    return id ? this.itemById().get(id) ?? null : null;
  }

  closeOutlineMove(): void {
    this.outlineMoveItemId.set(null);
    this.outlineMoveParentId.set(null);
    this.outlineMoveSearch.set('');
  }

  moveParentsFor(item: PlanItem): PlanItem[] {
    const items = this.items();
    const search = this.outlineMoveSearch().trim().toLocaleLowerCase();
    return this.stagingParents()
      .filter(parent => parent.id !== item.id && !this.isDescendant(parent, item, items))
      .filter(parent => !search || this.outlinePathLabel(parent).toLocaleLowerCase().includes(search));
  }

  selectOutlineItem(item: PlanItem): void {
    if (this.selectedOutlineItemId() !== item.id) {
      if (this.outlineEditorId() !== item.id) {
        this.closeOutlineEdit();
      }

      if (this.outlineMoveItemId() !== item.id) {
        this.closeOutlineMove();
      }

      if (this.outlineCreate()?.parentId !== item.id) {
        this.closeOutlineCreate();
      }
    }

    this.selectedOutlineItemId.set(item.id);
    this.dependencySearch.set('');
    this.dependencyCandidateId.set(null);
    this.loadDependencies(item.id);
  }

  isSelectedOutlineItem(item: PlanItem): boolean {
    return this.selectedOutlineItemId() === item.id;
  }

  outlineParent(item: PlanItem): PlanItem | null {
    return item.parentPlanItemId ? this.itemById().get(item.parentPlanItemId) ?? null : null;
  }

  outlinePathLabel(item: PlanItem): string {
    const path: string[] = [];
    const itemsById = this.itemById();
    let current: PlanItem | undefined = item;

    while (current) {
      path.unshift(current.title);
      current = current.parentPlanItemId ? itemsById.get(current.parentPlanItemId) : undefined;
    }

    return path.join(' / ');
  }

  dependencyLabel(dependency: PlanItemDependency): string {
    if (dependency.title) {
      return dependency.predecessorPlanItemId && this.itemById().has(dependency.predecessorPlanItemId)
        ? this.outlinePathLabel(this.itemById().get(dependency.predecessorPlanItemId)!)
        : dependency.title;
    }

    return dependency.predecessorSourceTaskUid
      ? `Imported task UID ${dependency.predecessorSourceTaskUid}`
      : 'Unresolved dependency';
  }

  successorLabel(dependency: PlanItemDependency): string {
    const successor = this.itemById().get(dependency.planItemId);
    return successor ? this.outlinePathLabel(successor) : dependency.title ?? 'Plan item';
  }

  setDependencyCandidate(candidateId: number | null): void {
    this.dependencyCandidateId.set(candidateId);
  }

  updateDependencyCreateLag(value: number | string): void {
    this.dependencyCreateLagMinutes.set(Number(value));
  }

  dependencyEditFor(dependency: PlanItemDependency): DependencyEdit {
    return this.dependencyEdits()[dependency.id] ?? {
      dependencyType: dependency.dependencyType,
      lagMinutes: dependency.lagMinutes
    };
  }

  updateDependencyEdit(dependency: PlanItemDependency, patch: Partial<DependencyEdit>): void {
    this.dependencyEdits.update(edits => ({
      ...edits,
      [dependency.id]: {
        ...this.dependencyEditFor(dependency),
        ...patch
      }
    }));
  }

  updateDependencyLag(dependency: PlanItemDependency, value: number | string): void {
    this.updateDependencyEdit(dependency, { lagMinutes: Number(value) });
  }

  isDependencyDirty(dependency: PlanItemDependency): boolean {
    const edit = this.dependencyEditFor(dependency);
    return edit.dependencyType !== dependency.dependencyType || edit.lagMinutes !== dependency.lagMinutes;
  }

  addDependency(item: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const predecessorPlanItemId = this.dependencyCandidateId();
    if (!predecessorPlanItemId) {
      this.error.set('Choose a predecessor plan item.');
      return;
    }

    this.dependencySaving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.addPlanItemDependency(item.id, {
      predecessorPlanItemId,
      dependencyType: this.dependencyCreateType(),
      lagMinutes: this.dependencyCreateLagMinutes()
    }).subscribe({
      next: dependency => {
        this.message.set(`${dependency.title ?? 'Dependency'} added as a predecessor.`);
        this.dependencyCandidateId.set(null);
        this.dependencySearch.set('');
        this.dependencyCreateType.set('FS');
        this.dependencyCreateLagMinutes.set(0);
        this.loadDependencies(item.id);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to add dependency.')),
      complete: () => this.dependencySaving.set(false)
    });
  }

  saveDependency(item: PlanItem, dependency: PlanItemDependency): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const edit = this.dependencyEditFor(dependency);
    this.dependencySaving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updatePlanItemDependency(item.id, dependency.id, edit).subscribe({
      next: updated => {
        this.message.set('Dependency meaning saved.');
        this.dependencies.update(dependencies => dependencies ? {
          ...dependencies,
          predecessors: dependencies.predecessors.map(current => current.id === updated.id ? updated : current)
        } : dependencies);
        this.dependencyEdits.update(edits => ({ ...edits, [updated.id]: this.toDependencyEdit(updated) }));
      },
      error: err => this.error.set(this.errorText(err, 'Failed to save dependency meaning.')),
      complete: () => this.dependencySaving.set(false)
    });
  }

  deleteDependency(item: PlanItem, dependency: PlanItemDependency): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    if (!window.confirm(`Remove predecessor ${this.dependencyLabel(dependency)}?`)) {
      return;
    }

    this.dependencySaving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.deletePlanItemDependency(item.id, dependency.id).subscribe({
      next: () => {
        this.message.set('Dependency removed.');
        this.loadDependencies(item.id);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to remove dependency.')),
      complete: () => this.dependencySaving.set(false)
    });
  }

  deleteSuccessorDependency(dependency: PlanItemDependency): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    if (!window.confirm(`Remove successor dependency ${this.successorLabel(dependency)}?`)) {
      return;
    }

    this.dependencySaving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.deletePlanItemDependency(dependency.planItemId, dependency.id).subscribe({
      next: () => {
        this.message.set('Dependency removed.');
        this.loadSelectedDependencies();
      },
      error: err => this.error.set(this.errorText(err, 'Failed to remove dependency.')),
      complete: () => this.dependencySaving.set(false)
    });
  }

  siblingItems(item: PlanItem): PlanItem[] {
    return this.items()
      .filter(candidate => candidate.parentPlanItemId === item.parentPlanItemId)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

  previousSibling(item: PlanItem): PlanItem | null {
    const siblings = this.siblingItems(item);
    const index = siblings.findIndex(sibling => sibling.id === item.id);
    return index > 0 ? siblings[index - 1] : null;
  }

  nextSibling(item: PlanItem): PlanItem | null {
    const siblings = this.siblingItems(item);
    const index = siblings.findIndex(sibling => sibling.id === item.id);
    return index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
  }

  moveOutlineUnder(): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const item = this.movingOutlineItem();
    const parentPlanItemId = this.outlineMoveParentId();
    if (!item || !parentPlanItemId) {
      this.error.set('Choose a destination parent.');
      return;
    }

    this.moveOutlineItem(item, {
      parentPlanItemId,
      placement: 'LastChild',
      referencePlanItemId: null
    }, () => this.closeOutlineMove());
  }

  moveOutlineUp(item: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const reference = this.previousSibling(item);
    if (!reference || !item.parentPlanItemId) {
      return;
    }

    this.moveOutlineItem(item, {
      parentPlanItemId: item.parentPlanItemId,
      placement: 'Before',
      referencePlanItemId: reference.id
    });
  }

  moveOutlineDown(item: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const reference = this.nextSibling(item);
    if (!reference || !item.parentPlanItemId) {
      return;
    }

    this.moveOutlineItem(item, {
      parentPlanItemId: item.parentPlanItemId,
      placement: 'After',
      referencePlanItemId: reference.id
    });
  }

  addOutlineChild(): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const planId = this.selectedPlanId();
    const form = this.outlineCreate();
    if (!planId || !form) {
      return;
    }

    const { parentId, ...item } = form;
    this.outlineSaving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.bulkCreatePlanItems(planId, {
      parentPlanItemId: parentId,
      items: [{
        ...item,
        title: item.title.trim(),
        notes: item.notes?.trim() || null,
        targetStartDate: item.targetStartDate || null,
        targetEndDate: item.targetEndDate || null
      }]
    }).subscribe({
      next: created => {
        this.outlineCreate.set(null);
        this.expandParent(parentId);
        this.message.set(`${created[0]?.title ?? 'Plan item'} added.`);
        this.loadPlans(planId);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to add plan item.')),
      complete: () => this.outlineSaving.set(false)
    });
  }

  descendantCount(item: PlanItem): number {
    const items = this.items();
    return items.filter(candidate => candidate.id !== item.id && this.isDescendant(candidate, item, items)).length;
  }

  deleteOutlineItem(item: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const descendants = this.descendantCount(item);
    const detail = descendants > 0 ? ` and ${descendants} child item${descendants === 1 ? '' : 's'}` : '';
    if (item.outlineLevel === 0 || !window.confirm(`Delete ${item.title}${detail}?`)) {
      return;
    }

    const planId = this.selectedPlanId();
    this.error.set(null);
    this.message.set(null);
    this.service.deletePlanItem(item.id).subscribe({
      next: result => {
        this.message.set(`${result.deletedCount} plan item${result.deletedCount === 1 ? '' : 's'} deleted.`);
        if (this.outlineEditorId() === item.id) {
          this.closeOutlineEdit();
        }

        if (planId) {
          this.loadPlans(planId);
        }
      },
      error: err => this.error.set(this.errorText(err, 'Failed to delete plan item.'))
    });
  }

  stagePastedItems(): void {
    try {
      const staged = this.parseStagingFile('pasted.csv', this.stagingText());
      if (staged.length === 0) {
        this.error.set('Paste at least one plan item title to stage.');
        return;
      }

      this.stagedItems.update(items => [...items, ...staged]);
      this.stagingText.set('');
      this.error.set(null);
      this.message.set(`${staged.length.toLocaleString()} plan item${staged.length === 1 ? '' : 's'} staged.`);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The pasted rows could not be parsed.');
    }
  }

  stageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.stagingFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const staged = this.parseStagingFile(file.name, String(reader.result ?? ''));
        if (staged.length === 0) {
          this.error.set('No plan items were found in that file.');
          return;
        }

        this.stagedItems.update(items => [...items, ...staged]);
        this.error.set(null);
        this.message.set(`${staged.length.toLocaleString()} plan item${staged.length === 1 ? '' : 's'} staged from ${file.name}.`);
      } catch (error) {
        this.error.set(error instanceof Error ? error.message : 'The staging file could not be parsed.');
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      this.error.set('The staging file could not be read.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  downloadStagingTemplate(): void {
    const csv = [
      'WBS,OutlineLevel,Title,Type,PercentComplete,Window,Start,End,Schedule,RolloverPolicy,Notes',
      '1,1,Example project,Project,0,Month,2026-06-01,2026-06-30,DuringTargetWindow,Normal,',
      '1.1,2,Example child task,Task,0,Week,2026-06-01,2026-06-07,DuringTargetWindow,Normal,',
      '2,1,Example queue item,QueueItem,0,Unscheduled,,,Never,Normal,'
    ].join('\r\n');
    this.downloadBlob('goals-plan-staging-template.csv', new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  }

  setFutureBulkPreset(preset: FutureBulkPreset): void {
    this.futureBulkPreset.set(preset);
    const section = this.futureBulkPresets.find(item => item.value === preset)?.section;
    if (section) {
      this.futureBulkSection.set(section);
    }
  }

  selectFutureBulkPlan(): void {
    const plan = this.planForFutureBulkYear();
    if (!plan) {
      this.error.set('Create the future annual plan before selecting it.');
      return;
    }

    this.selectPlan(plan.id);
  }

  createFutureBulkPlan(): void {
    const request = this.futureBulkPlanRequest();
    if (!request) {
      return;
    }

    this.futurePlanCreating.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.createPlan(request).subscribe({
      next: plan => {
        this.plans.update(plans => [...plans.filter(item => item.id !== plan.id), plan].sort((left, right) => right.year - left.year));
        this.selectPlan(plan.id);
        this.message.set(`${plan.year} draft plan created. Choose a section and stage future items.`);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to create future annual plan.')),
      complete: () => this.futurePlanCreating.set(false)
    });
  }

  stageFutureBulkItems(): void {
    const lines = this.futureBulkLines();
    const section = this.futureBulkSection().trim();
    const root = this.items().find(item => item.outlineLevel === 0);
    const year = this.futureBulkYear();

    if (!year) {
      this.error.set('Choose a future year before staging future items.');
      return;
    }

    if (this.selectedPlan()?.year !== year) {
      this.error.set('Select the matching future annual plan before staging future items.');
      return;
    }

    if (!root) {
      this.error.set('The selected plan has no root item. Reload the plan before staging future items.');
      return;
    }

    if (!section) {
      this.error.set('Enter a section name before staging future items.');
      return;
    }

    if (lines.length === 0) {
      this.error.set('Paste at least one future item title.');
      return;
    }

    const existingSection = this.items().find(item => item.outlineLevel === 1 && item.title.trim().toLocaleLowerCase() === section.toLocaleLowerCase());
    const sectionRow = existingSection ? null : {
      ...this.newStagedItem(section),
      itemType: 'Section',
      planningWindowType: 'Year',
      outlineLevel: 1,
      outlineNumber: '1',
      notes: `Future bulk section for ${this.futureBulkPreset()} items.`
    };
    const queueRows = lines.map((title, index) => ({
      ...this.newStagedItem(title),
      itemType: 'QueueItem',
      percentComplete: 0,
      planningWindowType: 'Unscheduled',
      scheduleSurfaceMode: 'Never',
      rolloverPolicy: 'Normal' as PlanItemRolloverPolicy,
      outlineLevel: existingSection ? null : 2,
      outlineNumber: existingSection ? null : `1.${index + 1}`,
      notes: `${this.futureBulkPreset()} future-year bulk add.`
    }));

    this.stagingParentId.set(existingSection?.id ?? root.id);
    this.stagingDefaultItemType.set('QueueItem');
    this.stagedItems.update(items => [...items, ...(sectionRow ? [sectionRow] : []), ...queueRows]);
    this.futureBulkText.set('');
    this.error.set(null);
    this.message.set(`${lines.length.toLocaleString()} future ${this.futureBulkPreset().toLocaleLowerCase()} item${lines.length === 1 ? '' : 's'} staged${existingSection ? ` under ${section}` : ` with new ${section} section`}.`);
  }

  downloadFutureBulkPreviewCsv(): void {
    this.downloadCsv('goals-future-bulk-preview.csv', [
      ['Row', 'Year', 'Section', 'Title', 'Item Type', 'Status'],
      ...this.futureBulkPreviewRows().map(row => [
        row.row,
        row.planYear ?? '',
        row.section,
        row.title,
        row.itemType,
        row.status
      ])
    ]);
  }

  downloadStagingValidationCsv(): void {
    this.downloadCsv('goals-staging-validation.csv', [
      ['Severity', 'Row', 'Title', 'Message'],
      ...this.stagedValidation().map(entry => [
        entry.severity,
        entry.row || '',
        entry.title,
        entry.message
      ])
    ]);
  }

  stagedRowSeverity(row: number): 'Error' | 'Warning' | null {
    const entries = this.stagedValidation().filter(entry => entry.row === row);
    if (entries.some(entry => entry.severity === 'Error')) {
      return 'Error';
    }

    return entries.some(entry => entry.severity === 'Warning') ? 'Warning' : null;
  }

  stagedRowValidationMessages(row: number): string[] {
    return this.stagedValidation()
      .filter(entry => entry.row === row)
      .map(entry => `${entry.severity}: ${entry.message}`);
  }

  validationCardClass(tone: StagedValidationCard['tone']): string {
    switch (tone) {
      case 'emerald':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900';
      case 'amber':
        return 'border-amber-200 bg-amber-50 text-amber-900';
      case 'red':
        return 'border-red-200 bg-red-50 text-red-900';
      default:
        return 'border-slate-200 bg-white text-slate-900';
    }
  }

  futureBulkCardClass(tone: FutureBulkCard['tone']): string {
    switch (tone) {
      case 'emerald':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900';
      case 'amber':
        return 'border-amber-200 bg-amber-50 text-amber-900';
      case 'blue':
        return 'border-blue-200 bg-white text-blue-950';
      default:
        return 'border-blue-100 bg-white text-slate-900';
    }
  }

  downloadStagingMappingCsv(): void {
    const headers = this.stagingHeaders();
    const selection = this.stagingColumnSelections();

    this.downloadCsv('goals-staging-column-mapping.csv', [
      ['Field', 'Mapped Header', 'Column Number'],
      ...this.stagingColumnOptions.map(option => {
        const index = selection[option.key];
        return [
          option.label,
          index === null ? '' : headers[index] || `Column ${index + 1}`,
          index === null ? '' : index + 1
        ];
      }),
      [],
      ['Preview Row', 'Title', 'Type', 'Percent', 'Window', 'Start', 'End', 'Schedule'],
      ...this.stagingMappingPreviewRows().map(row => [
        row.rowNumber,
        row.title,
        row.type,
        row.percent,
        row.window,
        row.start,
        row.end,
        row.schedule
      ])
    ]);
  }

  setStagingParent(parentId: number | null): void {
    this.stagingParentId.set(parentId);
  }

  updateStagedItem(key: number, patch: Partial<StagedPlanItem>): void {
    this.stagedItems.update(items => items.map(item => item.key === key ? { ...item, ...patch } : item));
  }

  updateStagedPercent(key: number, value: number | string): void {
    this.updateStagedItem(key, { percentComplete: Number(value) });
  }

  setStagingColumn(column: StageColumn, value: string | number | null): void {
    const index = value === null || value === '' ? null : Number(value);
    this.stagingColumnSelections.update(selection => ({ ...selection, [column]: index }));
  }

  autoMapMissingStagingColumns(): void {
    const detected = this.columnSelectionFromMap(this.csvColumnMap(this.stagingHeaders()));
    this.stagingColumnSelections.update(selection => {
      const next = { ...selection };
      this.stagingColumnOptions.forEach(option => {
        if (next[option.key] === null && detected[option.key] !== null) {
          next[option.key] = detected[option.key];
        }
      });
      return next;
    });
  }

  clearStagingColumnMapping(): void {
    this.stagingColumnPreset.set('Auto');
    this.stagingColumnSelections.set(this.emptyStageColumnSelections());
  }

  applyStagingColumnPreset(preset: StageColumnPreset): void {
    this.stagingColumnPreset.set(preset);
    const headers = this.stagingHeaders();
    const selection = preset === 'Auto'
      ? this.columnSelectionFromMap(this.csvColumnMap(headers))
      : this.presetColumnSelection(preset, headers);
    this.stagingColumnSelections.set(selection);
  }

  restageMappedRows(): void {
    const rows = this.stagingRows();
    if (rows.length === 0) {
      this.error.set('Upload or paste CSV rows before applying column mapping.');
      return;
    }

    const columnMap = this.columnMapFromSelection(this.stagingColumnSelections());
    if (!columnMap.has('title')) {
      this.error.set('Map a Title column before staging rows.');
      return;
    }

    const staged = rows
      .map(row => this.csvRowToStagedItem(row, columnMap))
      .filter((item): item is StagedPlanItem => !!item);
    this.stagedItems.set(staged);
    this.error.set(null);
    this.message.set(`${staged.length.toLocaleString()} plan item${staged.length === 1 ? '' : 's'} staged with the selected column mapping.`);
  }

  applyStagedBulkEdits(): void {
    const patch: Partial<StagedPlanItem> = {};
    if (this.stagingBulkItemType()) {
      patch.itemType = this.stagingBulkItemType();
    }

    if (this.stagingBulkPercent() !== null) {
      patch.percentComplete = Math.min(100, Math.max(0, Number(this.stagingBulkPercent())));
    }

    if (this.stagingBulkPlanningWindow()) {
      patch.planningWindowType = this.stagingBulkPlanningWindow();
    }

    if (this.stagingBulkStartDate()) {
      patch.targetStartDate = this.stagingBulkStartDate();
    }

    if (this.stagingBulkEndDate()) {
      patch.targetEndDate = this.stagingBulkEndDate();
    }

    if (this.stagingBulkScheduleMode()) {
      patch.scheduleSurfaceMode = this.stagingBulkScheduleMode();
    }

    if (this.stagingBulkRolloverPolicy()) {
      patch.rolloverPolicy = this.stagingBulkRolloverPolicy() as PlanItemRolloverPolicy;
    }

    if (Object.keys(patch).length === 0) {
      this.error.set('Choose at least one batch value to apply.');
      return;
    }

    this.stagedItems.update(items => items.map(item => ({ ...item, ...patch })));
    this.message.set(`Batch values applied to ${this.stagedItems().length.toLocaleString()} staged row${this.stagedItems().length === 1 ? '' : 's'}.`);
  }

  applyQueueStagingDefaults(): void {
    this.stagedItems.update(items => items.map(item => ({
      ...item,
      itemType: 'QueueItem',
      percentComplete: 0,
      scheduleSurfaceMode: 'Never',
      rolloverPolicy: 'Normal'
    })));
    this.message.set(`Queue defaults applied to ${this.stagedItems().length.toLocaleString()} staged row${this.stagedItems().length === 1 ? '' : 's'}.`);
  }

  clearStagedDates(): void {
    this.stagedItems.update(items => items.map(item => ({
      ...item,
      targetStartDate: null,
      targetEndDate: null,
      planningWindowType: 'Unscheduled',
      scheduleSurfaceMode: 'Never'
    })));
    this.message.set('Planning dates cleared from staged rows.');
  }

  removeStagedItem(key: number): void {
    this.stagedItems.update(items => items.filter(item => item.key !== key));
  }

  clearStagedItems(): void {
    this.stagedItems.set([]);
    this.stagingRows.set([]);
    this.stagingHeaders.set([]);
    this.stagingColumnSelections.set(this.emptyStageColumnSelections());
  }

  bulkAddStagedItems(): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const planId = this.selectedPlanId();
    const parentPlanItemId = this.stagingParentId();
    const items = this.stagedItems();

    if (!planId || !parentPlanItemId) {
      this.error.set('Choose a parent item in the selected annual plan.');
      return;
    }

    if (items.length === 0) {
      this.error.set('Stage at least one plan item before adding it.');
      return;
    }

    const errors = this.stagedErrors();
    if (errors.length > 0) {
      this.error.set(`Fix ${errors.length.toLocaleString()} staged row error${errors.length === 1 ? '' : 's'} before adding.`);
      return;
    }

    const warnings = this.stagedWarnings();
    if (warnings.length > 0 && !window.confirm(`Add staged rows with ${warnings.length.toLocaleString()} warning${warnings.length === 1 ? '' : 's'}?`)) {
      return;
    }

    const request: PlanItemBulkCreateRequest = {
      parentPlanItemId,
      items: items.map(({ key, importWarnings, ...item }) => ({
        ...item,
        title: item.title.trim(),
        notes: item.notes?.trim() || null,
        targetStartDate: item.targetStartDate || null,
        targetEndDate: item.targetEndDate || null
      }))
    };

    this.bulkAdding.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.bulkCreatePlanItems(planId, request).subscribe({
      next: created => {
        this.stagedItems.set([]);
        this.message.set(`${created.length.toLocaleString()} plan item${created.length === 1 ? '' : 's'} added.`);
        this.loadPlans(planId);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to add staged plan items.')),
      complete: () => this.bulkAdding.set(false)
    });
  }

  setBrowserView(view: BrowserView): void {
    this.browserView.set(view);
  }

  setWorkView(view: WorkView): void {
    this.workView.set(view);
  }

  setActiveScope(scope: ActiveScope): void {
    this.activeScope.set(scope);
  }

  setSchedulePreviewScope(scope: ActiveScope): void {
    this.schedulePreviewScope.set(scope);
    this.loadSchedulePreview();
  }

  focusSection(summary: SectionSummary): void {
    this.section.set(summary.section);
  }

  focusQueueSection(summary: SectionSummary): void {
    this.section.set(summary.section);
    this.itemType.set(summary.queueCount > 0 ? 'QueueItem' : '');
    this.leafWorkOnly.set(true);
    this.incompleteOnly.set(true);
    this.workView.set('all');
    this.browserView.set(summary.openLeafWorkCount > this.gridItemLimit ? 'outline' : 'grid');
  }

  inspectFocusedItem(item: PlanItem): void {
    this.workView.set('all');
    this.browserView.set('outline');
    this.expandAncestors(item);
    this.selectOutlineItem(item);
  }

  inspectSchedulePreviewItem(item: GoalSchedulePreviewItem): void {
    const planItem = this.itemById().get(item.planItemId);
    if (planItem) {
      this.inspectFocusedItem(planItem);
    }
  }

  focusDescription(): string {
    if (this.workView() === 'active') {
      return `Incomplete leaf work surfaced for ${this.activeScopeLabel().toLocaleLowerCase()} by its plan window or schedule mode.`;
    }

    if (this.workView() === 'unscheduled') {
      return 'Incomplete leaf work that is still off the master schedule feed.';
    }

    if (this.workView() === 'blocked') {
      return 'Incomplete leaf work waiting on at least one unfinished predecessor.';
    }

    return 'Incomplete leaf work with a native or imported plan end date before today.';
  }

  activeScopeLabel(): string {
    switch (this.activeScope()) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return 'Today';
    }
  }

  overdueGroupId(section: string): string {
    const slug = section
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `overdue-section-${slug || 'plan-root'}`;
  }

  jumpToOverdueGroup(section: string): void {
    document.getElementById(this.overdueGroupId(section))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  editFor(item: PlanItem): PlanItemEdit {
    return this.edits()[item.id] ?? this.toEdit(item);
  }

  updateEdit(item: PlanItem, patch: Partial<PlanItemEdit>): void {
    this.edits.update(edits => ({
      ...edits,
      [item.id]: {
        ...(edits[item.id] ?? this.toEdit(item)),
        ...patch
      }
    }));
    this.clearRowError(item.id);
  }

  updatePercent(item: PlanItem, value: number | string): void {
    this.updateEdit(item, { percentComplete: Number(value) });
  }

  nudgeEditWindow(item: PlanItem, days: number): void {
    const edit = this.editFor(item);
    const start = edit.targetStartDate || this.dateInputValue(item.importedStart);
    const end = edit.targetEndDate || this.dateInputValue(item.importedFinish) || start;
    if (!start && !end) {
      const target = this.localDateKey(this.addDays(new Date(), days));
      this.updateEdit(item, { targetStartDate: target, targetEndDate: target });
      return;
    }

    this.updateEdit(item, {
      targetStartDate: start ? this.shiftDateInput(start, days) : '',
      targetEndDate: end ? this.shiftDateInput(end, days) : ''
    });
  }

  isSaving(item: PlanItem): boolean {
    return this.savingIds().has(item.id);
  }

  rowError(item: PlanItem): string | null {
    return this.rowErrors()[item.id] ?? null;
  }

  isDirty(item: PlanItem): boolean {
    const edit = this.editFor(item);
    const original = this.toEdit(item);
    return edit.title !== original.title
      || edit.itemType !== original.itemType
      || edit.percentComplete !== original.percentComplete
      || edit.notes !== original.notes
      || edit.planningWindowType !== original.planningWindowType
      || edit.targetStartDate !== original.targetStartDate
      || edit.targetEndDate !== original.targetEndDate
      || edit.scheduleSurfaceMode !== original.scheduleSurfaceMode
      || edit.rolloverPolicy !== original.rolloverPolicy;
  }

  discardEdit(item: PlanItem): void {
    this.edits.update(edits => ({
      ...edits,
      [item.id]: this.toEdit(item)
    }));
    this.clearRowError(item.id);
  }

  saveItem(item: PlanItem): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    this.savePlanItem(item, this.updateRequest(this.editFor(item)));
  }

  canQuickProgress(item: PlanItem): boolean {
    return item.outlineLevel > 0 && !item.isSummary && !this.selectedPlanArchived();
  }

  quickProgress(item: PlanItem, percentComplete: number): void {
    if (!this.canQuickProgress(item) || this.isSaving(item)) {
      return;
    }

    const edit = this.toEdit(item);
    this.savePlanItem(item, this.updateRequest({
      ...edit,
      percentComplete
    }), percentComplete === 100 ? `${item.title} completed.` : `${item.title} set to ${percentComplete}%.`);
  }

  quickScheduleMode(item: PlanItem, scheduleSurfaceMode: ScheduleSurfaceMode): void {
    if (!this.canQuickProgress(item) || this.isSaving(item) || item.scheduleSurfaceMode === scheduleSurfaceMode) {
      return;
    }

    this.savePlanItem(item, this.updateRequest({
      ...this.toEdit(item),
      scheduleSurfaceMode
    }), `${item.title} schedule set to ${this.scheduleModeLabel(scheduleSurfaceMode)}.`);
  }

  isMassSelected(item: PlanItem): boolean {
    return this.massSelectedIds().has(item.id);
  }

  toggleMassSelection(item: PlanItem, checked: boolean): void {
    if (item.itemType !== 'QueueItem' || item.outlineLevel <= 0 || item.isSummary) {
      return;
    }

    this.massSelectedIds.update(ids => {
      const next = new Set(ids);
      if (checked) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
      return next;
    });
  }

  selectVisibleQueueRows(): void {
    this.massSelectedIds.update(ids => {
      const next = new Set(ids);
      this.massVisibleQueueItems().forEach(item => next.add(item.id));
      return next;
    });
  }

  selectFilteredQueueRows(): void {
    this.massSelectedIds.set(new Set(this.massEditableQueueItems().map(item => item.id)));
  }

  clearMassSelection(): void {
    this.massSelectedIds.set(new Set<number>());
  }

  applyMassEdit(): void {
    const patch: Partial<PlanItemEdit> = {};
    if (this.massPercent() !== null) {
      patch.percentComplete = Math.min(100, Math.max(0, Number(this.massPercent())));
    }
    if (this.massPlanningWindow()) {
      patch.planningWindowType = this.massPlanningWindow();
    }
    if (this.massStartDate()) {
      patch.targetStartDate = this.massStartDate();
    }
    if (this.massEndDate()) {
      patch.targetEndDate = this.massEndDate();
    }
    if (this.massScheduleMode()) {
      patch.scheduleSurfaceMode = this.massScheduleMode();
    }
    if (this.massRolloverPolicy()) {
      patch.rolloverPolicy = this.massRolloverPolicy() as PlanItemRolloverPolicy;
    }

    if (Object.keys(patch).length === 0) {
      this.error.set('Choose at least one mass edit value to apply.');
      return;
    }

    this.applyMassUpdate('mass edited', item => ({ ...this.toEdit(item), ...patch }));
  }

  markSelectedQueueDone(): void {
    this.applyMassUpdate('marked done', item => ({ ...this.toEdit(item), percentComplete: 100 }));
  }

  applySelectedQueueDefaults(): void {
    this.applyMassUpdate('set to queue defaults', item => ({
      ...this.toEdit(item),
      itemType: 'QueueItem',
      percentComplete: 0,
      planningWindowType: 'Unscheduled',
      targetStartDate: '',
      targetEndDate: '',
      scheduleSurfaceMode: 'Never',
      rolloverPolicy: 'Normal'
    }));
  }

  clearSelectedQueueDates(): void {
    this.applyMassUpdate('date fields cleared', item => ({
      ...this.toEdit(item),
      planningWindowType: 'Unscheduled',
      targetStartDate: '',
      targetEndDate: '',
      scheduleSurfaceMode: 'Never'
    }));
  }

  scheduleModeLabel(mode: string): string {
    switch (mode) {
      case 'ActiveGoalsOnly':
        return 'Active';
      case 'DuringTargetWindow':
        return 'Target window';
      case 'NearTargetEnd':
        return 'Near target end';
      case 'PinnedToSchedule':
        return 'Pinned';
      default:
        return 'Off';
    }
  }

  scheduleModeTitle(mode: string): string {
    switch (mode) {
      case 'ActiveGoalsOnly':
        return 'Surfaces while the goal item remains open.';
      case 'DuringTargetWindow':
        return 'Surfaces when its target window overlaps the schedule range.';
      case 'NearTargetEnd':
        return 'Surfaces during the week leading into its target end.';
      case 'PinnedToSchedule':
        return 'Surfaces while open regardless of its target window.';
      default:
        return 'Does not surface on the master schedule.';
    }
  }

  private loadPlanItems(planId: number): void {
    this.loading.set(true);
    this.service.getPlanItems(planId).subscribe({
      next: items => {
        this.items.set(items);
        this.edits.set(Object.fromEntries(items.map(item => [item.id, this.toEdit(item)])));
        if (this.selectedPlanArchived()) {
          this.closeOutlineCreate();
          this.closeOutlineEdit();
          this.closeOutlineMove();
        }

        this.ensureStagingParent(items);
        this.ensureSelectedOutlineItem(items);
        this.loadSelectedDependencies();
        this.loadSchedulePreview();
        this.collapsedIds.set(this.defaultCollapsedIds(items));
      },
      error: err => this.error.set(this.errorText(err, 'Failed to load annual plan items.')),
      complete: () => this.loading.set(false)
    });
  }

  private defaultCollapsedIds(items: PlanItem[]): Set<number> {
    const parentIds = new Set(items
      .map(item => item.parentPlanItemId)
      .filter((value): value is number => value !== null));

    return new Set(items
      .filter(item => item.outlineLevel > 0 && parentIds.has(item.id))
      .map(item => item.id));
  }

  private addAncestors(item: PlanItem, itemById: Map<number, PlanItem>, ids: Set<number>): void {
    let parentId = item.parentPlanItemId;

    while (parentId) {
      ids.add(parentId);
      parentId = itemById.get(parentId)?.parentPlanItemId ?? null;
    }
  }

  private hasCollapsedAncestor(item: PlanItem, itemById: Map<number, PlanItem>, collapsedIds: Set<number>): boolean {
    let parentId = item.parentPlanItemId;

    while (parentId) {
      if (collapsedIds.has(parentId)) {
        return true;
      }

      parentId = itemById.get(parentId)?.parentPlanItemId ?? null;
    }

    return false;
  }

  private isOpenLeafWorkItem(item: PlanItem): boolean {
    return this.isLeafWorkItem(item) && item.percentComplete < 100;
  }

  private isLeafWorkItem(item: PlanItem): boolean {
    return item.outlineLevel > 0 && !item.isSummary;
  }

  private isActiveItem(item: PlanItem, scope: ActiveScope = 'today'): boolean {
    if (!this.isOpenLeafWorkItem(item)) {
      return false;
    }

    const scopeRange = this.activeScopeRange(scope);
    switch (item.scheduleSurfaceMode) {
      case 'ActiveGoalsOnly':
      case 'PinnedToSchedule':
        return true;
      case 'DuringTargetWindow':
        return this.targetWindowOverlaps(item, scopeRange.start, scopeRange.end);
      case 'NearTargetEnd':
        return this.nearTargetEndOverlaps(item, scopeRange.start, scopeRange.end);
      default:
        return this.planWindowOverlaps(item, scopeRange.start, scopeRange.end);
    }
  }

  private isOverdueItem(item: PlanItem): boolean {
    const targetEndDate = this.planEndDateKey(item);
    return this.isOpenLeafWorkItem(item)
      && !!targetEndDate
      && targetEndDate < this.localDateKey(new Date());
  }

  private isUnscheduledItem(item: PlanItem): boolean {
    return this.isOpenLeafWorkItem(item)
      && item.scheduleSurfaceMode === 'Never';
  }

  private isBlockedItem(item: PlanItem): boolean {
    return this.isOpenLeafWorkItem(item)
      && item.unfinishedPredecessorCount > 0;
  }

  private targetWindowOverlaps(item: PlanItem, scopeStart: string, scopeEnd: string): boolean {
    const start = this.planDateKey(item.targetStartDate);
    const end = this.planDateKey(item.targetEndDate);

    return this.windowOverlaps(start, end, scopeStart, scopeEnd);
  }

  private nearTargetEndOverlaps(item: PlanItem, scopeStart: string, scopeEnd: string): boolean {
    const targetEndDate = this.planEndDateKey(item);
    return !!targetEndDate
      && targetEndDate >= scopeStart
      && this.localDateKey(this.addDays(this.localDate(targetEndDate), -7)) <= scopeEnd;
  }

  private compareFocusedItems(left: PlanItem, right: PlanItem): number {
    const leftEnd = this.planEndDateKey(left) ?? '9999-12-31';
    const rightEnd = this.planEndDateKey(right) ?? '9999-12-31';
    return leftEnd.localeCompare(rightEnd) || left.sortOrder - right.sortOrder;
  }

  private planDateKey(value: string | null): string | null {
    return value?.slice(0, 10) ?? null;
  }

  private planWindowOverlaps(item: PlanItem, scopeStart: string, scopeEnd: string): boolean {
    const start = this.planDateKey(item.targetStartDate) ?? this.planDateKey(item.importedStart);
    const end = this.planEndDateKey(item);

    return this.windowOverlaps(start, end, scopeStart, scopeEnd);
  }

  private planEndDateKey(item: PlanItem): string | null {
    return this.planDateKey(item.targetEndDate) ?? this.planDateKey(item.importedFinish);
  }

  private localDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private activeScopeRange(scope: ActiveScope): { start: string; end: string } {
    const today = new Date();
    if (scope === 'week') {
      const dayOffset = (today.getDay() + 6) % 7;
      const weekStart = this.addDays(today, -dayOffset);
      return {
        start: this.localDateKey(weekStart),
        end: this.localDateKey(this.addDays(weekStart, 6))
      };
    }

    if (scope === 'month') {
      return {
        start: this.localDateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: this.localDateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0))
      };
    }

    const todayKey = this.localDateKey(today);
    return { start: todayKey, end: todayKey };
  }

  private windowOverlaps(start: string | null, end: string | null, scopeStart: string, scopeEnd: string): boolean {
    return (!!start || !!end)
      && (!start || start <= scopeEnd)
      && (!end || end >= scopeStart);
  }

  private localDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number(part));
    return new Date(year, month - 1, day);
  }

  private addDays(value: Date, days: number): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);
  }

  private shiftDateInput(value: string, days: number): string {
    return this.localDateKey(this.addDays(this.localDate(value), days));
  }

  private rejectArchivedPlanChange(): boolean {
    if (!this.selectedPlanArchived()) {
      return false;
    }

    this.error.set('Archived annual plans are read-only. Mark this year as draft or active before changing it.');
    return true;
  }

  private ensureArchiveComparisonDefaults(plans: AnnualPlanSummary[]): void {
    const archived = plans.filter(plan => plan.status === 'Archived');
    if (!archived.some(plan => plan.id === this.archiveCompareLeftPlanId())) {
      this.archiveCompareLeftPlanId.set(archived[1]?.id ?? archived[0]?.id ?? null);
      this.archiveComparison.set(null);
    }

    if (!archived.some(plan => plan.id === this.archiveCompareRightPlanId())) {
      this.archiveCompareRightPlanId.set(archived[0]?.id ?? null);
      this.archiveComparison.set(null);
    }

    if (this.archiveCompareLeftPlanId() === this.archiveCompareRightPlanId() && archived.length > 1) {
      this.archiveCompareLeftPlanId.set(archived[1].id);
      this.archiveComparison.set(null);
    }
  }

  private groupFocusedReportItems(): FocusedReportGroup[] {
    if (this.workView() !== 'overdue' && this.workView() !== 'unscheduled' && this.workView() !== 'blocked') {
      const items = this.focusedReportItems();
      return [{ section: '', items, totalCount: this.focusedItems().length }];
    }

    const groups = new Map<string, PlanItem[]>();
    for (const item of this.focusedItems()) {
      const section = item.topLevelSection || 'Plan root';
      const sectionItems = groups.get(section) ?? [];
      sectionItems.push(item);
      groups.set(section, sectionItems);
    }

    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([section, groupedItems]) => ({
        section,
        items: groupedItems.slice(0, this.focusedSectionItemLimit),
        totalCount: groupedItems.length
      }));
  }

  private summarizeSections(): SectionSummary[] {
    const groups = new Map<string, PlanItem[]>();
    for (const item of this.items()) {
      const section = item.topLevelSection || 'Plan root';
      const sectionItems = groups.get(section) ?? [];
      sectionItems.push(item);
      groups.set(section, sectionItems);
    }

    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([section, items]) => {
        const leafWork = items.filter(item => this.isLeafWorkItem(item));
        const completedLeafWork = leafWork.filter(item => item.percentComplete >= 100).length;
        const openLeafWork = leafWork.filter(item => item.percentComplete < 100);
        return {
          section,
          totalCount: items.length,
          leafWorkCount: leafWork.length,
          completedLeafWorkCount: completedLeafWork,
          inProgressCount: leafWork.filter(item => item.percentComplete > 0 && item.percentComplete < 100).length,
          notStartedCount: leafWork.filter(item => item.percentComplete <= 0).length,
          openLeafWorkCount: openLeafWork.length,
          activeCount: leafWork.filter(item => this.isActiveItem(item)).length,
          overdueCount: leafWork.filter(item => this.isOverdueItem(item)).length,
          unscheduledCount: leafWork.filter(item => this.isUnscheduledItem(item)).length,
          scheduledCount: leafWork.filter(item => item.scheduleSurfaceMode !== 'Never').length,
          blockedCount: leafWork.filter(item => this.isBlockedItem(item)).length,
          queueCount: leafWork.filter(item => item.itemType === 'QueueItem').length,
          milestoneCount: leafWork.filter(item => item.isMilestone).length,
          notesCount: leafWork.filter(item => !!item.notes?.trim()).length,
          dependencyCount: leafWork.reduce((total, item) => total + item.importedPredecessorCount, 0),
          averagePercentComplete: this.averagePercent(leafWork),
          completionPercent: leafWork.length === 0 ? 0 : Math.round((completedLeafWork / leafWork.length) * 100)
        };
      });
  }

  private summarizeYear(): YearProgressReport {
    const items = this.items();
    const leafWork = items.filter(item => this.isLeafWorkItem(item));
    const completedLeafWork = leafWork.filter(item => item.percentComplete >= 100);
    return {
      totalCount: items.length,
      leafWorkCount: leafWork.length,
      completedLeafWorkCount: completedLeafWork.length,
      inProgressCount: leafWork.filter(item => item.percentComplete > 0 && item.percentComplete < 100).length,
      notStartedCount: leafWork.filter(item => item.percentComplete <= 0).length,
      openLeafWorkCount: leafWork.length - completedLeafWork.length,
      averagePercentComplete: this.averagePercent(leafWork),
      completionPercent: leafWork.length === 0 ? 0 : Math.round((completedLeafWork.length / leafWork.length) * 100),
      activeTodayCount: leafWork.filter(item => this.isActiveItem(item, 'today')).length,
      activeWeekCount: leafWork.filter(item => this.isActiveItem(item, 'week')).length,
      activeMonthCount: leafWork.filter(item => this.isActiveItem(item, 'month')).length,
      overdueCount: leafWork.filter(item => this.isOverdueItem(item)).length,
      unscheduledCount: leafWork.filter(item => this.isUnscheduledItem(item)).length,
      scheduledCount: leafWork.filter(item => item.scheduleSurfaceMode !== 'Never').length,
      blockedCount: leafWork.filter(item => this.isBlockedItem(item)).length,
      milestoneCount: leafWork.filter(item => item.isMilestone).length,
      notesCount: leafWork.filter(item => !!item.notes?.trim()).length,
      dependencyCount: leafWork.reduce((total, item) => total + item.importedPredecessorCount, 0),
      normalRolloverCount: leafWork.filter(item => item.rolloverPolicy === 'Normal').length,
      neverRolloverCount: leafWork.filter(item => item.rolloverPolicy === 'Never').length,
      alwaysRolloverCount: leafWork.filter(item => item.rolloverPolicy === 'Always').length,
      repeatNextYearCount: leafWork.filter(item => item.rolloverPolicy === 'RepeatNextYear').length
    };
  }

  private summarizeRolloverPolicies(): RolloverPolicyReport[] {
    const leafWork = this.items().filter(item => this.isLeafWorkItem(item));
    return this.rolloverPolicies.map(policy => {
      const policyItems = leafWork.filter(item => item.rolloverPolicy === policy);
      return {
        policy,
        leafWorkCount: policyItems.length,
        openLeafWorkCount: policyItems.filter(item => item.percentComplete < 100).length,
        completedLeafWorkCount: policyItems.filter(item => item.percentComplete >= 100).length
      };
    });
  }

  private averagePercent(items: PlanItem[]): number {
    if (items.length === 0) {
      return 0;
    }

    return Math.round(items.reduce((total, item) => total + item.percentComplete, 0) / items.length);
  }

  private downloadCsv(fileName: string, rows: CsvCell[][]): void {
    const csv = rows
      .map(row => row.map(cell => this.csvCell(cell)).join(','))
      .join('\r\n');
    this.downloadBlob(fileName, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  }

  private downloadBlob(fileName: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: CsvCell): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    return /[",\r\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  }

  private toEdit(item: PlanItem): PlanItemEdit {
    return {
      title: item.title,
      itemType: item.itemType,
      percentComplete: item.percentComplete,
      notes: item.notes ?? '',
      planningWindowType: item.planningWindowType,
      targetStartDate: this.dateInputValue(item.targetStartDate),
      targetEndDate: this.dateInputValue(item.targetEndDate),
      scheduleSurfaceMode: item.scheduleSurfaceMode,
      rolloverPolicy: item.rolloverPolicy
    };
  }

  private updateRequest(edit: PlanItemEdit): PlanItemUpdateRequest {
    return {
      title: edit.title.trim(),
      itemType: edit.itemType,
      percentComplete: edit.percentComplete,
      notes: edit.notes.trim() || null,
      planningWindowType: edit.planningWindowType,
      targetStartDate: edit.targetStartDate || null,
      targetEndDate: edit.targetEndDate || null,
      scheduleSurfaceMode: edit.scheduleSurfaceMode,
      rolloverPolicy: edit.rolloverPolicy
    };
  }

  private futureBulkPlanRequest(): AnnualPlanCreateRequest | null {
    const year = Number(this.futureBulkYear());
    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      this.error.set('Future plan year must be between 1900 and 3000.');
      return null;
    }

    const existing = this.plans().find(plan => plan.year === year);
    if (existing) {
      this.error.set(`${year} already exists. Select that plan instead of creating a new one.`);
      return null;
    }

    return {
      year,
      title: this.futureBulkTitle().trim() || `Goals and Plans ${year}`
    };
  }

  private planForFutureBulkYear(): AnnualPlanSummary | null {
    const year = Number(this.futureBulkYear());
    return Number.isInteger(year)
      ? this.plans().find(plan => plan.year === year) ?? null
      : null;
  }

  private savePlanItem(item: PlanItem, request: PlanItemUpdateRequest, message?: string): void {
    this.setSaving(item.id, true);
    this.clearRowError(item.id);
    this.error.set(null);

    this.service.updatePlanItem(item.id, request).subscribe({
      next: updated => {
        this.items.update(items => items.map(current => current.id === updated.id ? updated : current));
        this.edits.update(edits => ({ ...edits, [updated.id]: this.toEdit(updated) }));
        this.loadSchedulePreview();
        this.message.set(message ?? `${updated.title} saved.`);
      },
      error: err => this.setRowError(item.id, this.errorText(err, 'Failed to save plan item.')),
      complete: () => this.setSaving(item.id, false)
    });
  }

  private applyMassUpdate(actionLabel: string, editFactory: (item: PlanItem) => PlanItemEdit): void {
    if (this.rejectArchivedPlanChange()) {
      return;
    }

    const selectedItems = this.massSelectedItems();
    if (selectedItems.length === 0) {
      this.error.set('Select at least one queue row before applying a mass action.');
      return;
    }

    const capitalizedLabel = `${actionLabel[0].toLocaleUpperCase()}${actionLabel.slice(1)}`;
    if (!window.confirm(`${capitalizedLabel} ${selectedItems.length.toLocaleString()} selected queue row${selectedItems.length === 1 ? '' : 's'}?`)) {
      return;
    }

    const selectedIds = new Set(selectedItems.map(item => item.id));
    this.savingIds.update(ids => new Set([...ids, ...selectedIds]));
    selectedItems.forEach(item => this.clearRowError(item.id));
    this.massEditing.set(true);
    this.error.set(null);
    this.message.set(null);

    forkJoin(selectedItems.map(item => this.service.updatePlanItem(item.id, this.updateRequest(editFactory(item))))).subscribe({
      next: updatedItems => {
        const updatedById = new Map(updatedItems.map(item => [item.id, item]));
        this.items.update(items => items.map(item => updatedById.get(item.id) ?? item));
        this.edits.update(edits => ({
          ...edits,
          ...Object.fromEntries(updatedItems.map(item => [item.id, this.toEdit(item)]))
        }));
        this.massSelectedIds.update(ids => new Set([...ids].filter(id => !updatedById.has(id))));
        this.loadSchedulePreview();
        this.message.set(`${updatedItems.length.toLocaleString()} queue row${updatedItems.length === 1 ? '' : 's'} ${actionLabel}.`);
      },
      error: err => {
        this.error.set(this.errorText(err, 'Failed to apply queue mass action.'));
        const planId = this.selectedPlanId();
        if (planId) {
          this.loadPlanItems(planId);
        }
      },
      complete: () => {
        this.savingIds.update(ids => new Set([...ids].filter(id => !selectedIds.has(id))));
        this.massEditing.set(false);
      }
    });
  }

  private dateInputValue(value: string | null): string {
    return value?.slice(0, 10) ?? '';
  }

  private setSaving(itemId: number, saving: boolean): void {
    const next = new Set(this.savingIds());
    if (saving) {
      next.add(itemId);
    } else {
      next.delete(itemId);
    }

    this.savingIds.set(next);
  }

  private clearRowError(itemId: number): void {
    this.rowErrors.update(errors => {
      const next = { ...errors };
      delete next[itemId];
      return next;
    });
  }

  private setRowError(itemId: number, error: string): void {
    this.rowErrors.update(errors => ({ ...errors, [itemId]: error }));
    this.setSaving(itemId, false);
  }

  private moveOutlineItem(item: PlanItem, request: PlanItemMoveRequest, onMoved?: () => void): void {
    const planId = this.selectedPlanId();
    if (!planId) {
      return;
    }

    this.outlineMoving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.movePlanItem(item.id, request).subscribe({
      next: result => {
        this.message.set(`${result.movedCount} plan item${result.movedCount === 1 ? '' : 's'} moved.`);
        onMoved?.();
        this.expandParent(request.parentPlanItemId);
        this.loadPlans(planId);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to move plan item.')),
      complete: () => this.outlineMoving.set(false)
    });
  }

  private ensureStagingParent(items: PlanItem[]): void {
    if (items.some(item => item.id === this.stagingParentId())) {
      return;
    }

    this.stagingParentId.set(items.find(item => item.outlineLevel === 0)?.id ?? null);
  }

  private ensureSelectedOutlineItem(items: PlanItem[]): void {
    if (items.some(item => item.id === this.selectedOutlineItemId())) {
      return;
    }

    this.selectedOutlineItemId.set(items.find(item => item.outlineLevel > 0)?.id ?? items[0]?.id ?? null);
  }

  private loadSelectedDependencies(): void {
    const selectedId = this.selectedOutlineItemId();
    if (selectedId) {
      this.loadDependencies(selectedId);
    } else {
      this.dependencies.set(null);
    }
  }

  private loadSchedulePreview(): void {
    const planId = this.selectedPlanId();
    if (!planId) {
      this.schedulePreview.set([]);
      return;
    }

    const range = this.activeScopeRange(this.schedulePreviewScope());
    this.schedulePreviewLoading.set(true);
    this.service.getSchedulePreview(planId, range.start, range.end).subscribe({
      next: items => this.schedulePreview.set(items),
      error: err => this.error.set(this.errorText(err, 'Failed to load the Goals schedule preview.')),
      complete: () => this.schedulePreviewLoading.set(false)
    });
  }

  private loadDependencies(itemId: number): void {
    this.dependencyLoading.set(true);
    this.service.getPlanItemDependencies(itemId).subscribe({
      next: dependencies => {
        if (this.selectedOutlineItemId() !== dependencies.planItemId) {
          return;
        }

        this.dependencies.set(dependencies);
        this.dependencyEdits.set(Object.fromEntries(dependencies.predecessors.map(dependency => [
          dependency.id,
          this.toDependencyEdit(dependency)
        ])));
        this.items.update(items => items.map(item => item.id === dependencies.planItemId
          ? {
              ...item,
              importedPredecessorCount: dependencies.predecessors.length,
              unfinishedPredecessorCount: dependencies.predecessors
                .filter(dependency => dependency.status !== 'Complete').length
            }
          : item));
      },
      error: err => this.error.set(this.errorText(err, 'Failed to load dependencies.')),
      complete: () => this.dependencyLoading.set(false)
    });
  }

  private toDependencyEdit(dependency: PlanItemDependency): DependencyEdit {
    return {
      dependencyType: dependency.dependencyType,
      lagMinutes: dependency.lagMinutes
    };
  }

  private newStagedItem(title: string): StagedPlanItem {
    return {
      key: this.nextStagedKey++,
      title,
      itemType: this.stagingDefaultItemType(),
      percentComplete: 0,
      notes: null,
      planningWindowType: 'Unscheduled',
      targetStartDate: null,
      targetEndDate: null,
      scheduleSurfaceMode: 'Never',
      rolloverPolicy: 'Normal'
    };
  }

  private validateStagedItems(): StagedValidationEntry[] {
    const entries: StagedValidationEntry[] = [];
    const parentId = this.stagingParentId();
    const parent = parentId ? this.itemById().get(parentId) : null;
    const existingSiblingTitles = new Set(this.items()
      .filter(item => parentId && item.parentPlanItemId === parentId)
      .map(item => item.title.trim().toLocaleLowerCase()));
    const stagedTitleCounts = new Map<string, number>();

    this.stagedItems().forEach(item => {
      const title = item.title.trim().toLocaleLowerCase();
      if (title) {
        stagedTitleCounts.set(title, (stagedTitleCounts.get(title) ?? 0) + 1);
      }
    });

    this.stagedItems().forEach((item, index) => {
      const row = index + 1;
      const title = item.title.trim();
      const add = (severity: StagedValidationEntry['severity'], message: string) => {
        entries.push({ severity, row, title: title || '(blank title)', message });
      };

      if (!title) {
        add('Error', 'Title is required.');
      }

      if (!this.editableItemTypes.includes(item.itemType)) {
        add('Error', `Type "${item.itemType}" is not valid.`);
      }

      if (!Number.isFinite(item.percentComplete) || item.percentComplete < 0 || item.percentComplete > 100) {
        add('Error', 'Percent complete must be between 0 and 100.');
      }

      if (!this.planningWindowTypes.includes(item.planningWindowType)) {
        add('Error', `Planning window "${item.planningWindowType}" is not valid.`);
      }

      if (!this.scheduleSurfaceModes.includes(item.scheduleSurfaceMode as ScheduleSurfaceMode)) {
        add('Error', `Schedule mode "${item.scheduleSurfaceMode}" is not valid.`);
      }

      if (!this.rolloverPolicies.includes(item.rolloverPolicy)) {
        add('Error', `Rollover policy "${item.rolloverPolicy}" is not valid.`);
      }

      if (item.targetStartDate && item.targetEndDate && item.targetStartDate > item.targetEndDate) {
        add('Error', 'Target start date is after target end date.');
      }

      if (item.outlineLevel !== null && item.outlineLevel !== undefined && (!Number.isInteger(item.outlineLevel) || item.outlineLevel < 1 || item.outlineLevel > 50)) {
        add('Error', 'Outline level must be a whole number between 1 and 50.');
      }

      if (item.importWarnings?.length) {
        item.importWarnings.forEach(message => add('Warning', message));
      }

      const normalizedTitle = title.toLocaleLowerCase();
      if (normalizedTitle && (stagedTitleCounts.get(normalizedTitle) ?? 0) > 1) {
        add('Warning', 'Duplicate title appears in the staged rows.');
      }

      if (normalizedTitle && existingSiblingTitles.has(normalizedTitle)) {
        add('Warning', 'A sibling item already has this title.');
      }

      if (item.scheduleSurfaceMode !== 'Never' && !item.targetStartDate && !item.targetEndDate && item.planningWindowType !== 'Year') {
        add('Warning', 'This is scheduled but has no target dates.');
      }

      if (item.scheduleSurfaceMode === 'PinnedToSchedule' && !item.targetStartDate && !item.targetEndDate) {
        add('Warning', 'Pinned schedule rows work best with at least one target date.');
      }

      if ((item.targetStartDate || item.targetEndDate) && item.scheduleSurfaceMode === 'Never') {
        add('Warning', 'This has target dates but will not surface on the master schedule.');
      }

      if (item.planningWindowType === 'DateRange' && (!item.targetStartDate || !item.targetEndDate)) {
        add('Warning', 'DateRange rows should include both start and end dates.');
      }

      if (item.percentComplete === 100 && item.rolloverPolicy !== 'Never') {
        add('Warning', 'Completed staged row will still use a rollover policy.');
      }

      if (item.itemType === 'QueueItem' && parent && parent.topLevelSection && !['Listen', 'Puzzles', 'Read', 'Video Games', 'Watch'].includes(parent.topLevelSection)) {
        add('Warning', `Queue item is being added under ${parent.topLevelSection}.`);
      }
    });

    const outlineLevels = this.stagedItems().map(item => this.effectiveStagedOutlineLevel(item));
    outlineLevels.forEach((level, index) => {
      if (!level || level <= 1) {
        return;
      }

      const hasParentLevel = outlineLevels.slice(0, index).includes(level - 1);
      if (!hasParentLevel) {
        const item = this.stagedItems()[index];
        entries.push({
          severity: 'Error',
          row: index + 1,
          title: item.title.trim() || '(blank title)',
          message: 'Outline hierarchy skips a parent level before this row.'
        });
      }
    });

    if (this.stagedItems().length > this.gridItemLimit) {
      entries.push({
        severity: 'Warning',
        row: 0,
        title: 'Staged batch',
        message: `Large batch contains ${this.stagedItems().length.toLocaleString()} rows.`
      });
    }

    return entries;
  }

  private defaultChildType(parent: PlanItem): string {
    return parent.outlineLevel === 0 ? 'Section' : parent.topLevelSection && ['Listen', 'Puzzles', 'Read', 'Video Games', 'Watch'].includes(parent.topLevelSection)
      ? 'QueueItem'
      : 'Task';
  }

  private effectiveStagedOutlineLevel(item: StagedPlanItem): number | null {
    if (item.outlineLevel) {
      return item.outlineLevel;
    }

    if (!item.outlineNumber) {
      return null;
    }

    const parts = item.outlineNumber.split('.').map(part => part.trim()).filter(Boolean);
    return parts.length > 0 && parts.every(part => Number.isInteger(Number(part))) ? parts.length : null;
  }

  private expandParent(parentId: number): void {
    if (!this.collapsedIds().has(parentId)) {
      return;
    }

    const next = new Set(this.collapsedIds());
    next.delete(parentId);
    this.collapsedIds.set(next);
  }

  private expandAncestors(item: PlanItem): void {
    const next = new Set(this.collapsedIds());
    const itemsById = this.itemById();
    let parentId = item.parentPlanItemId;

    while (parentId) {
      next.delete(parentId);
      parentId = itemsById.get(parentId)?.parentPlanItemId ?? null;
    }

    this.collapsedIds.set(next);
  }

  private isDescendant(candidate: PlanItem, parent: PlanItem, items: PlanItem[]): boolean {
    const itemById = new Map(items.map(item => [item.id, item]));
    let parentId = candidate.parentPlanItemId;
    while (parentId) {
      if (parentId === parent.id) {
        return true;
      }

      parentId = itemById.get(parentId)?.parentPlanItemId ?? null;
    }

    return false;
  }

  private parseStagingFile(fileName: string, content: string): StagedPlanItem[] {
    if (fileName.toLocaleLowerCase().endsWith('.txt')) {
      this.stagingHeaders.set([]);
      this.stagingRows.set([]);
      this.stagingColumnSelections.set(this.emptyStageColumnSelections());
      return this.parseStagedTitles(content).map(title => this.newStagedItem(title));
    }

    const rows = this.parseCsv(content)
      .map(row => row.map(value => value.trim()))
      .filter(row => row.some(Boolean));
    if (rows.length === 0) {
      return [];
    }

    const columnMap = this.csvColumnMap(rows[0]);
    if (!columnMap.has('title')) {
      if (rows.every(row => row.length <= 1)) {
        this.stagingHeaders.set([]);
        this.stagingRows.set([]);
        this.stagingColumnSelections.set(this.emptyStageColumnSelections());
        return rows
          .map(row => row[0]?.trim())
          .filter((value): value is string => !!value)
          .map(title => this.newStagedItem(title));
      }

      throw new Error('CSV files with columns need a Title header.');
    }

    this.stagingHeaders.set(rows[0]);
    this.stagingRows.set(rows.slice(1));
    this.stagingColumnPreset.set('Auto');
    this.stagingColumnSelections.set(this.columnSelectionFromMap(columnMap));

    return rows.slice(1)
      .map(row => this.csvRowToStagedItem(row, columnMap))
      .filter((item): item is StagedPlanItem => !!item);
  }

  private csvRowToStagedItem(row: string[], columnMap: Map<StageColumn, number>): StagedPlanItem | null {
    const title = this.csvValue(row, columnMap, 'title');
    if (!title) {
      return null;
    }

    const item = this.newStagedItem(title);
    const importWarnings: string[] = [];
    const itemType = this.csvChoice(row, columnMap, 'itemType', this.editableItemTypes);
    const planningWindowType = this.csvChoice(row, columnMap, 'planningWindowType', this.planningWindowTypes);
    const scheduleSurfaceMode = this.csvChoice(row, columnMap, 'scheduleSurfaceMode', this.scheduleSurfaceModes);
    const rolloverPolicy = this.csvChoice(row, columnMap, 'rolloverPolicy', this.rolloverPolicies);
    const percentComplete = this.csvPercent(row, columnMap);
    const outlineLevel = this.csvInteger(row, columnMap, 'outlineLevel');
    this.addInvalidChoiceWarning(row, columnMap, 'itemType', this.editableItemTypes, 'type', importWarnings);
    this.addInvalidChoiceWarning(row, columnMap, 'planningWindowType', this.planningWindowTypes, 'planning window', importWarnings);
    this.addInvalidChoiceWarning(row, columnMap, 'scheduleSurfaceMode', this.scheduleSurfaceModes, 'schedule mode', importWarnings);
    this.addInvalidChoiceWarning(row, columnMap, 'rolloverPolicy', this.rolloverPolicies, 'rollover policy', importWarnings);
    this.addInvalidNumberWarning(row, columnMap, 'percentComplete', 'percent complete', importWarnings);
    this.addInvalidIntegerWarning(row, columnMap, 'outlineLevel', 'outline level', importWarnings);
    this.addInvalidDateWarning(row, columnMap, 'targetStartDate', 'start date', importWarnings);
    this.addInvalidDateWarning(row, columnMap, 'targetEndDate', 'end date', importWarnings);

    return {
      ...item,
      itemType: itemType ?? item.itemType,
      percentComplete: percentComplete ?? item.percentComplete,
      notes: this.csvValue(row, columnMap, 'notes') || null,
      planningWindowType: planningWindowType ?? item.planningWindowType,
      targetStartDate: this.csvDate(row, columnMap, 'targetStartDate'),
      targetEndDate: this.csvDate(row, columnMap, 'targetEndDate'),
      scheduleSurfaceMode: scheduleSurfaceMode ?? item.scheduleSurfaceMode,
      rolloverPolicy: (rolloverPolicy ?? item.rolloverPolicy) as PlanItemRolloverPolicy,
      outlineLevel,
      outlineNumber: this.csvValue(row, columnMap, 'outlineNumber') || null,
      importWarnings
    };
  }

  private csvColumnMap(headers: string[]): Map<StageColumn, number> {
    const aliases = new Map<string, StageColumn>([
      ['title', 'title'],
      ['name', 'title'],
      ['item', 'title'],
      ['task', 'title'],
      ['taskname', 'title'],
      ['subject', 'title'],
      ['description', 'title'],
      ['type', 'itemType'],
      ['itemtype', 'itemType'],
      ['tasktype', 'itemType'],
      ['kind', 'itemType'],
      ['category', 'itemType'],
      ['percentcomplete', 'percentComplete'],
      ['percent', 'percentComplete'],
      ['percentage', 'percentComplete'],
      ['pct', 'percentComplete'],
      ['pctcomplete', 'percentComplete'],
      ['complete', 'percentComplete'],
      ['completed', 'percentComplete'],
      ['progress', 'percentComplete'],
      ['done', 'percentComplete'],
      ['isdone', 'percentComplete'],
      ['checked', 'percentComplete'],
      ['finished', 'percentComplete'],
      ['status', 'percentComplete'],
      ['notes', 'notes'],
      ['note', 'notes'],
      ['comments', 'notes'],
      ['comment', 'notes'],
      ['details', 'notes'],
      ['window', 'planningWindowType'],
      ['planningwindow', 'planningWindowType'],
      ['planningwindowtype', 'planningWindowType'],
      ['windowtype', 'planningWindowType'],
      ['timespan', 'planningWindowType'],
      ['bucket', 'planningWindowType'],
      ['period', 'planningWindowType'],
      ['start', 'targetStartDate'],
      ['startdate', 'targetStartDate'],
      ['from', 'targetStartDate'],
      ['datebegin', 'targetStartDate'],
      ['begin', 'targetStartDate'],
      ['begindate', 'targetStartDate'],
      ['targetstart', 'targetStartDate'],
      ['targetstartdate', 'targetStartDate'],
      ['end', 'targetEndDate'],
      ['enddate', 'targetEndDate'],
      ['finish', 'targetEndDate'],
      ['finishdate', 'targetEndDate'],
      ['due', 'targetEndDate'],
      ['duedate', 'targetEndDate'],
      ['to', 'targetEndDate'],
      ['targetend', 'targetEndDate'],
      ['targetenddate', 'targetEndDate'],
      ['schedule', 'scheduleSurfaceMode'],
      ['schedulemode', 'scheduleSurfaceMode'],
      ['schedulesurfacemode', 'scheduleSurfaceMode'],
      ['surfacemode', 'scheduleSurfaceMode'],
      ['masterschedule', 'scheduleSurfaceMode'],
      ['showonschedule', 'scheduleSurfaceMode'],
      ['calendar', 'scheduleSurfaceMode'],
      ['rollover', 'rolloverPolicy'],
      ['rolloverpolicy', 'rolloverPolicy'],
      ['carryforward', 'rolloverPolicy'],
      ['nextyear', 'rolloverPolicy'],
      ['outlinelevel', 'outlineLevel'],
      ['level', 'outlineLevel'],
      ['indent', 'outlineLevel'],
      ['depth', 'outlineLevel'],
      ['outline', 'outlineNumber'],
      ['outlinenumber', 'outlineNumber'],
      ['wbs', 'outlineNumber'],
      ['wbscode', 'outlineNumber']
    ]);
    const columns = new Map<StageColumn, number>();

    headers.forEach((header, index) => {
      const column = aliases.get(header.replace(/^\uFEFF/, '').toLocaleLowerCase().replace(/[\s_-]+/g, ''));
      if (column && !columns.has(column)) {
        columns.set(column, index);
      }
    });

    return columns;
  }

  private emptyStageColumnSelections(): Record<StageColumn, number | null> {
    return Object.fromEntries(this.stagingColumnOptions.map(option => [option.key, null])) as Record<StageColumn, number | null>;
  }

  private columnSelectionFromMap(columnMap: Map<StageColumn, number>): Record<StageColumn, number | null> {
    const selection = this.emptyStageColumnSelections();
    columnMap.forEach((index, column) => {
      selection[column] = index;
    });
    return selection;
  }

  private columnMapFromSelection(selection: Record<StageColumn, number | null>): Map<StageColumn, number> {
    const columnMap = new Map<StageColumn, number>();
    this.stagingColumnOptions.forEach(option => {
      const index = selection[option.key];
      if (index !== null && Number.isFinite(index)) {
        columnMap.set(option.key, index);
      }
    });
    return columnMap;
  }

  private presetColumnSelection(preset: StageColumnPreset, headers: string[]): Record<StageColumn, number | null> {
    if (preset === 'Auto') {
      return this.columnSelectionFromMap(this.csvColumnMap(headers));
    }

    const normalizedHeaders = headers.map(header => header.replace(/^\uFEFF/, '').toLocaleLowerCase().replace(/[\s_-]+/g, ''));
    const find = (...names: string[]) => {
      const normalizedNames = names.map(name => name.toLocaleLowerCase().replace(/[\s_-]+/g, ''));
      const index = normalizedHeaders.findIndex(header => normalizedNames.includes(header));
      return index >= 0 ? index : null;
    };
    const selection = this.emptyStageColumnSelections();

    if (preset === 'ProjectCsv') {
      selection.outlineNumber = find('WBS', 'Outline Number');
      selection.outlineLevel = find('Outline Level', 'Level');
      selection.title = find('Task Name', 'Name', 'Title');
      selection.percentComplete = find('% Complete', 'Percent Complete');
      selection.targetStartDate = find('Start');
      selection.targetEndDate = find('Finish', 'End');
      selection.notes = find('Notes');
    } else if (preset === 'QueueList') {
      selection.title = find('Title', 'Name', 'Item', 'Task');
      selection.itemType = find('Type', 'Item Type', 'Kind');
      selection.notes = find('Notes', 'Comments');
      selection.targetStartDate = find('Start', 'Start Date');
      selection.targetEndDate = find('End', 'Due', 'Due Date');
      selection.scheduleSurfaceMode = find('Schedule', 'Schedule Mode', 'Calendar');
    } else if (preset === 'Checklist') {
      selection.title = find('Title', 'Task', 'Item', 'Name');
      selection.percentComplete = find('Done', 'Complete', 'Completed', 'Checked', 'Status');
      selection.notes = find('Notes', 'Comments', 'Details');
      selection.targetEndDate = find('Due', 'Due Date', 'End');
    } else if (preset === 'Timeline') {
      selection.title = find('Title', 'Task', 'Item', 'Name');
      selection.itemType = find('Type', 'Item Type', 'Kind');
      selection.percentComplete = find('Percent Complete', '% Complete', 'Progress');
      selection.planningWindowType = find('Window', 'Planning Window', 'Period');
      selection.targetStartDate = find('Start', 'Start Date', 'From');
      selection.targetEndDate = find('End', 'End Date', 'Finish', 'Due', 'To');
      selection.scheduleSurfaceMode = find('Schedule', 'Schedule Mode', 'Calendar');
      selection.rolloverPolicy = find('Rollover', 'Rollover Policy', 'Carry Forward');
      selection.notes = find('Notes', 'Comments', 'Details');
    } else {
      selection.title = find('Title', 'Name', 'Item', 'Task');
      selection.notes = find('Notes', 'Comments');
    }

    return selection;
  }

  private csvValue(row: string[], columnMap: Map<StageColumn, number>, column: StageColumn): string {
    const index = columnMap.get(column);
    return index === undefined ? '' : row[index]?.trim() ?? '';
  }

  private csvChoice(
    row: string[],
    columnMap: Map<StageColumn, number>,
    column: StageColumn,
    choices: string[]
  ): string | null {
    const value = this.csvValue(row, columnMap, column);
    return choices.find(choice => choice.toLocaleLowerCase() === value.toLocaleLowerCase()) ?? null;
  }

  private addInvalidChoiceWarning(
    row: string[],
    columnMap: Map<StageColumn, number>,
    column: StageColumn,
    choices: string[],
    label: string,
    warnings: string[]
  ): void {
    const value = this.csvValue(row, columnMap, column);
    if (value && !choices.some(choice => choice.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      warnings.push(`Imported ${label} "${value}" was not recognized and was replaced with the default.`);
    }
  }

  private addInvalidNumberWarning(
    row: string[],
    columnMap: Map<StageColumn, number>,
    column: StageColumn,
    label: string,
    warnings: string[]
  ): void {
    const value = this.csvValue(row, columnMap, column).replace('%', '');
    if (value && this.percentWordValue(value) === null && !Number.isFinite(Number(value))) {
      warnings.push(`Imported ${label} "${value}" is not a number and was replaced with the default.`);
    }
  }

  private addInvalidIntegerWarning(
    row: string[],
    columnMap: Map<StageColumn, number>,
    column: StageColumn,
    label: string,
    warnings: string[]
  ): void {
    const value = this.csvValue(row, columnMap, column);
    if (value && !Number.isInteger(Number(value))) {
      warnings.push(`Imported ${label} "${value}" is not a whole number and was left blank.`);
    }
  }

  private addInvalidDateWarning(
    row: string[],
    columnMap: Map<StageColumn, number>,
    column: 'targetStartDate' | 'targetEndDate',
    label: string,
    warnings: string[]
  ): void {
    const value = this.csvValue(row, columnMap, column);
    if (value && Number.isNaN(new Date(value).valueOf())) {
      warnings.push(`Imported ${label} "${value}" is not a valid date and was left blank.`);
    }
  }

  private csvPercent(row: string[], columnMap: Map<StageColumn, number>): number | null {
    const value = this.csvValue(row, columnMap, 'percentComplete').replace('%', '');
    if (!value) {
      return null;
    }

    const wordValue = this.percentWordValue(value);
    if (wordValue !== null) {
      return wordValue;
    }

    const percent = Number(value);
    return Number.isFinite(percent) ? percent : null;
  }

  private percentWordValue(value: string): number | null {
    switch (value.trim().toLocaleLowerCase()) {
      case 'done':
      case 'yes':
      case 'y':
      case 'true':
      case 'complete':
      case 'completed':
      case 'finished':
      case 'x':
        return 100;
      case 'no':
      case 'n':
      case 'false':
      case 'open':
      case 'todo':
      case 'notstarted':
      case 'not started':
        return 0;
      default:
        return null;
    }
  }

  private csvInteger(row: string[], columnMap: Map<StageColumn, number>, column: StageColumn): number | null {
    const value = this.csvValue(row, columnMap, column);
    if (!value) {
      return null;
    }

    const number = Number(value);
    return Number.isInteger(number) ? number : null;
  }

  private csvDate(row: string[], columnMap: Map<StageColumn, number>, column: 'targetStartDate' | 'targetEndDate'): string | null {
    const value = this.csvValue(row, columnMap, column);
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
  }

  private parseCsv(value: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < value.length; index++) {
      const character = value[index];
      const next = value[index + 1];

      if (character === '"' && quoted && next === '"') {
        field += '"';
        index++;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        row.push(field);
        field = '';
      } else if ((character === '\n' || character === '\r') && !quoted) {
        if (character === '\r' && next === '\n') {
          index++;
        }

        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += character;
      }
    }

    if (quoted) {
      throw new Error('CSV contains an unterminated quoted field.');
    }

    if (field || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    return rows;
  }

  private parseStagedTitles(value: string): string[] {
    return value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  }

  private errorText(err: { error?: unknown; message?: string }, fallback: string): string {
    return typeof err.error === 'string' ? err.error : err.message ?? fallback;
  }
}
