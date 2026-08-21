import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import {
  MusicAlbumDetail,
  MusicAlbumSaveRequest,
  MusicArtistCreateRequest,
  MusicArtistCreateResponse,
  MusicArtistSummary,
  MusicArtistWithAlbums,
  MetalArchivesBandSearchResult,
  MusicMetalArchivesAddWantRequest,
  MusicMetalArchivesAddWantResult,
  MusicMetalArchivesComparison,
  MusicMetalArchivesManualCompareRequest,
  MusicWantListItem
} from './models/music.models';

@Injectable({ providedIn: 'root' })
export class MusicService {
  private readonly http = inject(HttpClient);
  private readonly albumsUrl = `${environment.apiUrl}/MusicAlbums`;
  private readonly artistsUrl = `${environment.apiUrl}/artists`;

  getAlbums(format?: string) {
    const params = format && format !== 'All' ? new HttpParams().set('format', format) : undefined;
    return this.http.get<MusicArtistWithAlbums[]>(this.albumsUrl, { params });
  }

  getAlbum(id: number) {
    return this.http.get<MusicAlbumDetail>(`${this.albumsUrl}/${id}`);
  }

  getWantList() {
    return this.http.get<MusicWantListItem[]>(`${this.albumsUrl}/want-list`);
  }

  searchMetalArchivesBands(band: string) {
    const params = new HttpParams().set('band', band);
    return this.http.get<MetalArchivesBandSearchResult[]>(`${this.albumsUrl}/metal-archives/search`, { params });
  }

  compareMetalArchivesBand(metalArchivesBandId: string, bandName: string) {
    const params = new HttpParams().set('bandName', bandName);
    return this.http.get<MusicMetalArchivesComparison>(`${this.albumsUrl}/metal-archives/${metalArchivesBandId}/missing-releases`, { params });
  }

  compareManualMetalArchivesReleases(request: MusicMetalArchivesManualCompareRequest) {
    return this.http.post<MusicMetalArchivesComparison>(`${this.albumsUrl}/metal-archives/manual-compare`, request);
  }

  addMetalArchivesWants(request: MusicMetalArchivesAddWantRequest) {
    return this.http.post<MusicMetalArchivesAddWantResult>(`${this.albumsUrl}/metal-archives/add-wants`, request);
  }

  createAlbum(request: MusicAlbumSaveRequest) {
    return this.http.post<MusicAlbumDetail>(this.albumsUrl, request);
  }

  updateAlbum(id: number, request: MusicAlbumSaveRequest) {
    return this.http.put<void>(`${this.albumsUrl}/${id}`, request);
  }

  deleteAlbum(id: number) {
    return this.http.delete<void>(`${this.albumsUrl}/${id}`);
  }

  getArtists() {
    return this.http.get<MusicArtistSummary[]>(`${this.artistsUrl}/summary`);
  }

  createArtist(request: MusicArtistCreateRequest) {
    return this.http.post<MusicArtistCreateResponse>(this.artistsUrl, request);
  }
}
