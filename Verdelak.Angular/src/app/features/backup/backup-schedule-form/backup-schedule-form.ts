
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-backup-schedule-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './backup-schedule-form.html',
  styleUrl: './backup-schedule-form.scss'
})
export class BackupScheduleForm implements OnInit {
  private fb = inject(FormBuilder);

  dayKeys = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const;

  get f() { return this.form.controls as any; }

  get weeklyDaysGroup(): FormGroup {
    return this.form.get('weeklyDays') as FormGroup;
  }

  sources = signal<BackupSource[]>([]);
  destinations = signal<BackupDestination[]>([]);
  saving = signal(false);
  message = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],

    sourceID: [null as number | null, Validators.required],
    destinationID: [null as number | null, Validators.required],

    compressionEnabled: [true],
    encryptionEnabled: [false],
    verifyAfterCopy: [true],

    scheduleType: ['Monthly', Validators.required],
    startDate: [new Date().toISOString().substring(0, 10), Validators.required], // yyyy-MM-dd
    endDate: [null as string | null],

    // Recurrence helpers (we'll compile to recurrencePattern on submit)
    // Monthly
    monthlyDay: [1, [Validators.min(1), Validators.max(31)]],
    monthlyInterval: [3, [Validators.min(1), Validators.max(12)]], // every N months

    // Weekly
    weeklyDays: this.fb.group({
      Sun: [false], Mon: [false], Tue: [false], Wed: [false], Thu: [false], Fri: [false], Sat: [false]
    }),

    // OneTime
    oneTimeDate: [new Date().toISOString().substring(0, 10)],

    // Cron
    cronExpr: ['']
  });

   constructor(private service: BackupService) { }

  ngOnInit(): void {
    this.service.getSources().subscribe((list: BackupSource[]) => this.sources.set(list));
    this.service.getDestinations().subscribe((list: BackupDestination[]) => this.destinations.set(list));
  }


  compilePattern(): string {
    const scheduleType = this.f.scheduleType.value as string;
    if (scheduleType === 'Monthly') {
      const day = this.f.monthlyDay.value ?? 1;
      const interval = this.f.monthlyInterval.value ?? 1;
      return `Monthly:day=${day};interval=${interval}`;
    }
    if (scheduleType === 'Weekly') {
      const daysGroup = this.f.weeklyDays.value as Record<string, boolean>;
      const selected = Object.entries(daysGroup).filter(([k, v]) => v).map(([k]) => k);
      const days = selected.length ? selected.join(',') : 'Sun';
      return `Weekly:days=${days}`; // backend can map to previous format if needed
    }
    if (scheduleType === 'Daily') {
      return 'Daily';
    }
    if (scheduleType === 'OneTime') {
      const d = this.f.oneTimeDate.value as string;
      return d; // your backend's OneTime branch parses a date string
    }
    if (scheduleType === 'Cron') {
      return this.f.cronExpr.value as string;
    }
    return 'Daily';
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.message.set(null);

    const recurrencePattern = this.compilePattern();

    const taskDto: ScheduledTaskDto = {
      title: this.f.title.value,
      description: this.f.description.value || undefined,
      taskType: 'Backup',
      isActive: true,
      scheduleType: this.f.scheduleType.value,
      startDate: new Date(this.f.startDate.value).toISOString(),
      endDate: this.f.endDate.value ? new Date(this.f.endDate.value).toISOString() : undefined,
      recurrencePattern
    };

    try {

      this.service.createTask(taskDto).subscribe({
        next: async (createdTask) => {
          if (!createdTask?.taskID) throw new Error('Task creation failed: missing taskID');
            const jobDto: BackupJobDto = {
              taskID: createdTask.taskID,
              sourceID: this.f.sourceID.value,
              destinationID: this.f.destinationID.value,
              compressionEnabled: this.f.compressionEnabled.value,
              encryptionEnabled: this.f.encryptionEnabled.value,
              verifyAfterCopy: this.f.verifyAfterCopy.value,
              notes: this.f.description.value || undefined
            };

            this.service.createBackupJob(jobDto).subscribe({
              next: () => { 
              this.message.set('Backup job scheduled successfully.');
              this.form.reset({
                title: '', description: '', sourceID: null, destinationID: null,
                compressionEnabled: true, encryptionEnabled: false, verifyAfterCopy: true,
                scheduleType: 'Monthly', startDate: new Date().toISOString().substring(0, 10), endDate: null,
                monthlyDay: 1, monthlyInterval: 3,
                weeklyDays: { Sun: false, Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false },
                oneTimeDate: new Date().toISOString().substring(0, 10), cronExpr: ''
              });
               },
              error: (err) => {
                console.error('Job create failed', err.error?.errors || err.error || err);
                this.message.set(err?.error?.title || 'Failed to create backup job');
              }
            });


         },
        error: (err) => {
          console.error('Task create failed', err.error || err);
          this.message.set(err?.error?.title || err?.message || 'Failed to create task');
        }
      });
 
    } catch (err: any) {
      this.message.set(err?.message || 'Failed to schedule backup job');
    } finally {
      this.saving.set(false);
    }
  }
}
import { BackupDestination, BackupJobDto, BackupSource, ScheduledTaskDto } from '../models/backup.models';import { BackupService } from '../backup-service';

