import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogService } from '../blog/blog.service';
import { BlogPostSummary } from '../blog/models/blog.models';
import { ShoppingListItem } from '../shopping-list/models/shopping-list.models';
import { ShoppingListService } from '../shopping-list/shopping-list.service';
import { MasterScheduleItem } from '../tasks/models/scheduled-task.model';
import { TaskService } from '../tasks/task';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  readonly latestBlogPost = signal<BlogPostSummary | null>(null);
  readonly blogLoading = signal(false);
  readonly blogError = signal<string | null>(null);
  readonly todayTasks = signal<MasterScheduleItem[]>([]);
  readonly tasksLoading = signal(false);
  readonly tasksError = signal<string | null>(null);
  readonly taskActionId = signal<string | null>(null);
  readonly taskMessage = signal<string | null>(null);
  readonly shoppingItems = signal<ShoppingListItem[]>([]);
  readonly shoppingLoading = signal(false);
  readonly shoppingSaving = signal(false);
  readonly shoppingError = signal<string | null>(null);
  readonly shoppingMessage = signal<string | null>(null);
  readonly shoppingCategories = signal<string[]>(this.defaultShoppingCategories());
  readonly quickShoppingItemName = signal('');
  readonly quickShoppingCategory = signal('Grocery');
  readonly quickShoppingQuantity = signal<number | null>(null);
  readonly quickShoppingUnit = signal('');

  readonly shoppingGroups = computed(() => {
    const groups = new Map<string, ShoppingListItem[]>();
    for (const item of this.shoppingItems()) {
      groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, items]) => ({
        category,
        items: items.sort((left, right) => left.itemName.localeCompare(right.itemName))
      }));
  });

  constructor(
    private readonly blogService: BlogService,
    private readonly taskService: TaskService,
    private readonly shoppingListService: ShoppingListService
  ) {}

  ngOnInit(): void {
    this.loadLatestBlogPost();
    this.loadTodayTasks();
    this.loadShoppingList();
  }

  private loadLatestBlogPost(): void {
    this.blogLoading.set(true);
    this.blogError.set(null);

    this.blogService.getPosts({ page: 1, pageSize: 1 }).subscribe({
      next: result => this.latestBlogPost.set(result.items[0] ?? null),
      error: err => this.blogError.set(err.error ?? err.message ?? 'Latest blog entry could not be loaded.'),
      complete: () => this.blogLoading.set(false)
    });
  }

  loadTodayTasks(): void {
    const today = this.localDateKey(new Date());
    this.tasksLoading.set(true);
    this.tasksError.set(null);

    this.taskService.getMasterSchedule(today, today).subscribe({
      next: items => this.todayTasks.set(items
        .sort((left, right) => this.taskSort(left, right))),
      error: err => this.tasksError.set(typeof err.error === 'string' ? err.error : err.message ?? 'Today’s tasks could not be loaded.'),
      complete: () => this.tasksLoading.set(false)
    });
  }

  loadShoppingList(): void {
    this.shoppingLoading.set(true);
    this.shoppingError.set(null);

    this.shoppingListService.getShoppingCategories().subscribe({
      next: settings => this.shoppingCategories.set(settings.categories.length ? settings.categories : this.defaultShoppingCategories()),
      error: () => this.shoppingCategories.set(this.defaultShoppingCategories())
    });

    this.shoppingListService.getItems('All', 'All', 'Needed').subscribe({
      next: items => {
        this.shoppingItems.set(items);
        if (!this.shoppingCategories().includes(this.quickShoppingCategory())) {
          this.quickShoppingCategory.set(this.shoppingCategories()[0] ?? 'Grocery');
        }
      },
      error: err => this.shoppingError.set(typeof err.error === 'string' ? err.error : err.message ?? 'Shopping list could not be loaded.'),
      complete: () => this.shoppingLoading.set(false)
    });
  }

  addQuickShoppingItem(): void {
    const itemName = this.quickShoppingItemName().trim();
    const category = this.quickShoppingCategory().trim() || 'Grocery';
    if (!itemName) {
      this.shoppingError.set('Enter an item to add to the grocery list.');
      return;
    }

    this.shoppingSaving.set(true);
    this.shoppingError.set(null);
    this.shoppingMessage.set(null);
    this.shoppingListService.createItem({
      itemName,
      category,
      quantity: this.quickShoppingQuantity(),
      unit: this.quickShoppingUnit().trim() || null,
      sourceArea: null,
      sourceType: null,
      sourceId: null,
      reason: 'Home quick add',
      notes: null
    }).subscribe({
      next: item => {
        this.shoppingMessage.set(`${item.itemName} added.`);
        this.quickShoppingItemName.set('');
        this.quickShoppingQuantity.set(null);
        this.quickShoppingUnit.set('');
        this.loadShoppingList();
      },
      error: err => this.shoppingError.set(typeof err.error === 'string' ? err.error : err.message ?? 'Shopping item could not be added.'),
      complete: () => this.shoppingSaving.set(false)
    });
  }

  completeTask(task: MasterScheduleItem): void {
    if (!task.canComplete) {
      return;
    }

    this.taskActionId.set(task.id);
    this.tasksError.set(null);
    this.taskMessage.set(null);
    const today = this.localDateKey(new Date());
    if (task.source === 'Goals') {
      this.taskService.completeGoal(task.sourceId).subscribe({
        next: () => {
          this.taskMessage.set(`${task.title} completed.`);
          this.loadTodayTasks();
        },
        error: (err: { error?: unknown; message?: string }) => this.tasksError.set(typeof err.error === 'string' ? err.error : err.message ?? 'Task could not be completed.'),
        complete: () => this.taskActionId.set(null)
      });
      return;
    }

    if (!task.occurrenceId) {
      this.taskActionId.set(null);
      return;
    }

    this.taskService.markComplete(task.occurrenceId, today).subscribe({
      next: () => {
        this.taskMessage.set(`${task.title} completed.`);
        this.loadTodayTasks();
      },
      error: (err: { error?: unknown; message?: string }) => this.tasksError.set(typeof err.error === 'string' ? err.error : err.message ?? 'Task could not be completed.'),
      complete: () => this.taskActionId.set(null)
    });
  }

  setGoalProgress(task: MasterScheduleItem, percentComplete: number): void {
    if (task.source !== 'Goals' || !task.canComplete) {
      return;
    }

    const clamped = Math.min(100, Math.max(0, Math.round(Number(percentComplete) || 0)));
    this.taskActionId.set(task.id);
    this.tasksError.set(null);
    this.taskMessage.set(null);
    this.taskService.updateGoalProgress(task.sourceId, clamped).subscribe({
      next: () => {
        this.taskMessage.set(clamped === 100 ? `${task.title} completed.` : `${task.title} set to ${clamped}%.`);
        this.loadTodayTasks();
      },
      error: err => this.tasksError.set(typeof err.error === 'string' ? err.error : err.message ?? 'Goal progress could not be updated.'),
      complete: () => this.taskActionId.set(null)
    });
  }

  bumpGoalProgress(task: MasterScheduleItem, amount: number): void {
    this.setGoalProgress(task, (task.percentComplete ?? 0) + amount);
  }

  taskTone(task: MasterScheduleItem): string {
    switch (task.source) {
      case 'Goals':
        return 'border-violet-200 bg-violet-50 text-violet-800';
      case 'Fish':
        return 'border-cyan-200 bg-cyan-50 text-cyan-900';
      case 'Backups':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'Gardening':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  }

  statusTone(task: MasterScheduleItem): string {
    switch (task.status) {
      case 'Completed':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'Skipped':
        return 'border-slate-200 bg-slate-50 text-slate-700';
      case 'Missed':
        return 'border-rose-200 bg-rose-50 text-rose-800';
      default:
        return 'border-amber-200 bg-amber-50 text-amber-800';
    }
  }

  private taskSort(left: MasterScheduleItem, right: MasterScheduleItem): number {
    const statusRank = (status: string) => status === 'Scheduled' ? 0 : status === 'Missed' ? 1 : status === 'Skipped' ? 2 : 3;
    return statusRank(left.status) - statusRank(right.status)
      || left.source.localeCompare(right.source)
      || left.title.localeCompare(right.title);
  }

  private localDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private defaultShoppingCategories(): string[] {
    return ['Grocery', 'Pet', 'Household', 'Garden', 'Canning', 'Medical', 'Other'];
  }
}
