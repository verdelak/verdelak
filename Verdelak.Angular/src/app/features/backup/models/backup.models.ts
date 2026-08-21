export interface BackupSource {
  sourceID: number;
  name: string;
  pathOrURI: string;
  type: string;
  notes?: string;
}

export interface BackupDestination {
  destinationID: number;
  name: string;
  pathOrURI: string;
  type: string;
  notes?: string;
}

export interface ScheduledTaskDto {
  taskID?: number;
  title: string;
  description?: string;
  taskType: string; // "Backup"
  isActive: boolean;
  scheduleType: 'OneTime' | 'Daily' | 'Weekly' | 'Monthly' | 'Cron';
  startDate: string; // ISO
  endDate?: string;  // ISO
  recurrencePattern: string; // e.g., "Monthly:day=1;interval=3" or "Weekly:days=Mon,Thu"
}

export interface BackupJobDto {
  backupJobID?: number;
  taskID: number;
  sourceID: number;
  destinationID: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  verifyAfterCopy: boolean;
  notes?: string;
}

export interface BackupJobSummary {
  backupJobID: number;
  taskID: number;
  taskTitle?: string;
  scheduleType?: string;
  recurrencePattern?: string;
  taskIsActive?: boolean;
  sourceID: number;
  sourceName?: string;
  sourcePathOrURI?: string;
  sourceType?: string;
  destinationID: number;
  destinationName?: string;
  destinationPathOrURI?: string;
  destinationType?: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  verifyAfterCopy: boolean;
  lastRun?: string;
  lastLogTimestamp?: string;
  lastLogSuccess?: boolean;
  lastLogMessage?: string;
  notes?: string;
}

export interface BackupLog {
  logID: number;
  backupJobID: number;
  occurrenceID?: number;
  timestamp: string;
  success: boolean;
  message?: string;
  bytesCopied?: number;
  durationSeconds?: number;
}

export interface BackupLogCreate {
  backupJobID: number;
  occurrenceID?: number;
  timestamp?: string;
  success: boolean;
  message?: string;
  bytesCopied?: number;
  durationSeconds?: number;
}

export interface BackupHealthReport {
  generatedAt: string;
  totalJobs: number;
  activeJobs: number;
  healthyJobs: number;
  dueSoonJobs: number;
  overdueJobs: number;
  neverCompletedJobs: number;
  unknownFrequencyJobs: number;
  items: BackupHealthReportItem[];
}

export interface BackupHealthReportItem {
  backupJobID: number;
  taskID: number;
  taskTitle?: string;
  isActive: boolean;
  sourceName: string;
  sourcePathOrURI?: string;
  destinationName: string;
  destinationPathOrURI?: string;
  scheduleType?: string;
  recurrencePattern?: string;
  frequencyLabel: string;
  expectedEveryDays?: number;
  lastCompletedAt?: string;
  lastAttemptAt?: string;
  lastAttemptSucceeded?: boolean;
  nextDueAt?: string;
  daysSinceLastCompleted?: number;
  daysUntilDue?: number;
  healthStatus: 'Healthy' | 'DueSoon' | 'Overdue' | 'NeverCompleted' | 'UnknownFrequency' | 'Inactive';
  healthMessage: string;
}
