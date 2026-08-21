import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environments';

export interface Link {
  id: number;
  name: string;
  url: string;
  verificationDate?: string;
  topic?: string;
  subTopic?: string;
}


export interface LinkItemDto {
  id: number;
  name: string;
  url: string;
  verificationDate?: string;
}

export interface SubTopicGroupDto {
  subTopic: string;
  links: LinkItemDto[];
}

export interface GroupedLinkDto {
  topic: string;
  subTopics: SubTopicGroupDto[];
}


@Injectable({ providedIn: 'root' })
export class LinksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/links/grouped`

  readonly groupedLinks = toSignal(
    this.http.get<GroupedLinkDto[]>(this.apiUrl),
    { initialValue: [] }
  );
}