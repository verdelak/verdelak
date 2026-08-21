import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { GuitarExplorerOptions, GuitarExplorerRequest, GuitarExplorerResult } from './models/guitar.models';

@Injectable({ providedIn: 'root' })
export class GuitarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/guitar`;

  getOptions() {
    return this.http.get<GuitarExplorerOptions>(`${this.baseUrl}/options`);
  }

  explore(request: GuitarExplorerRequest) {
    return this.http.post<GuitarExplorerResult>(`${this.baseUrl}/explore`, request);
  }
}
