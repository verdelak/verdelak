import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environments';
import { ResumeData, ResumeDocument, ResumeItem, ResumeItemSave, ResumeProfile } from './models/resume.models';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/resume`;

  getResume() {
    return this.http.get<ResumeDocument>(this.baseUrl).pipe(map(document => this.toResumeData(document)));
  }

  getAdminResume() {
    return this.http.get<ResumeDocument>(`${this.baseUrl}/admin`);
  }

  saveProfile(profile: ResumeProfile) {
    return this.http.put<ResumeProfile>(`${this.baseUrl}/profile`, profile);
  }

  createItem(item: ResumeItemSave) {
    return this.http.post<ResumeItem>(`${this.baseUrl}/items`, item);
  }

  updateItem(id: number, item: ResumeItemSave) {
    return this.http.put<ResumeItem>(`${this.baseUrl}/items/${id}`, item);
  }

  deleteItem(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/items/${id}`);
  }

  toResumeData(document: ResumeDocument): ResumeData {
    const activeItems = document.items.filter(item => item.isActive);

    return {
      profile: document.profile,
      skillGroups: activeItems
        .filter(item => item.section === 'Skills')
        .map(item => ({ title: item.title, skills: item.tags.length ? item.tags : this.lines(item.body) })),
      experience: activeItems
        .filter(item => item.section === 'Experience')
        .map(item => ({
          role: item.title,
          organization: item.subtitle ?? '',
          start: item.startText ?? '',
          end: item.endText ?? '',
          location: item.location,
          highlights: this.lines(item.body)
        })),
      projects: activeItems
        .filter(item => item.section === 'Projects')
        .map(item => ({
          name: item.title,
          description: item.body ?? '',
          technologies: item.tags
        })),
      education: activeItems
        .filter(item => item.section === 'Education')
        .map(item => ({
          credential: item.title,
          school: item.subtitle ?? '',
          year: item.endText || item.startText,
          notes: item.body
        })),
      certificationsAwards: activeItems
        .filter(item => item.section === 'Certifications & Awards')
        .map(item => ({
          name: item.title,
          issuer: item.subtitle,
          year: item.endText || item.startText,
          notes: item.body,
          tags: item.tags
        }))
    };
  }

  private lines(value?: string) {
    return (value ?? '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  }
}
