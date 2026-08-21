export interface ScheduledTask {
  taskID: number;
  title: string;
  description?: string;
  taskType: string;
  isActive: boolean;
  scheduleType: string;
  recurrencePattern: string;
  startDate: string;
  endDate?: string;
  tags?: ScheduledTaskTag[];
}

export interface ScheduledTaskTag {
  taskID: number;
  tag: string;
}

export interface ScheduledTaskRequest {
  title: string;
  description?: string | null;
  taskType: string;
  isActive: boolean;
  scheduleType: string;
  recurrencePattern: string;
  startDate: string;
  endDate?: string | null;
}

export interface GenerateOccurrencesResult {
  created: number;
}

export interface TaskOccurrence {
  occurrenceID: number;
  taskID: number;
  scheduledDate: string;
  completedDate?: string;
  status: 'Scheduled' | 'Completed' | 'Missed' | 'Skipped';
  notes?: string;
}

export interface TaskOccurrenceActivity {
  occurrenceID: number;
  taskID: number;
  taskTitle: string;
  taskType: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'Scheduled' | 'Completed' | 'Missed' | 'Skipped';
  notes?: string;
  tags: string[];
}

export interface MasterScheduleItem {
  id: string;
  source: string;
  sourceType: string;
  sourceId: number;
  occurrenceId: number | null;
  title: string;
  detail: string | null;
  scheduledDate: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  percentComplete: number | null;
  canComplete: boolean;
  canMove: boolean;
  canSkip: boolean;
  canReopen: boolean;
}

export interface TaskOccurrenceUpdateRequest {
  status?: 'Scheduled' | 'Completed' | 'Missed' | 'Skipped';
  scheduledDate?: string;
  completedDate?: string;
  notes?: string | null;
}

export interface ScheduleGenerationResult {
  from: string;
  to: string;
  activeTaskCount: number;
  createdCount: number;
  missingCount: number;
  sources: ScheduleGenerationSourceSummary[];
  tasks: ScheduleGenerationTaskSummary[];
}

export interface ScheduleGenerationSourceSummary {
  source: string;
  activeTaskCount: number;
  createdCount: number;
  missingCount: number;
}

export interface ScheduleGenerationTaskSummary {
  taskID: number;
  title: string;
  taskType: string;
  source: string;
  missingCount: number;
  createdCount: number;
}
