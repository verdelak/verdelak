import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RESUME_DATA } from '../data/resume-data';
import { ResumeData } from '../models/resume.models';
import { ResumeService } from '../resume.service';

@Component({
  selector: 'app-resume-page',
  imports: [CommonModule],
  templateUrl: './resume-page.html',
  styleUrl: './resume-page.scss'
})
export class ResumePage implements OnInit {
  readonly resume = signal<ResumeData>(RESUME_DATA);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly service: ResumeService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getResume().subscribe({
      next: resume => this.resume.set(resume),
      error: err => this.error.set(err.error ?? err.message ?? 'Resume could not be loaded.'),
      complete: () => this.loading.set(false)
    });
  }
}
