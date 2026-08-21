export type MusicFormat = 'CD' | 'Tape' | 'Vinyl' | 'MP3';

export interface MusicArtistSummary {
  id: number;
  artist: string;
}

export interface MusicArtistCreateRequest {
  band: string;
}

export interface MusicArtistCreateResponse {
  id: number;
  band: string;
}

export interface MusicAlbumSummary {
  id: number;
  title: string;
  format: MusicFormat;
}

export interface MusicArtistWithAlbums {
  id: number;
  artist: string;
  albums: MusicAlbumSummary[];
}

export interface MusicAlbumDetail {
  id: number;
  title: string;
  artist: MusicArtistSummary;
  reviews: MusicReview[];
  releaseDate?: string | null;
  infoText?: string | null;
  additionalInfo?: string | null;
  format: MusicFormat;
}

export interface MusicReview {
  id: number;
  albumID: number;
  reviewerID: number;
  rating: number;
  text: string;
  createdAt: string;
}

export interface MusicAlbumSaveRequest {
  title: string;
  artistID: number;
  releaseDate?: string | null;
  infoText?: string | null;
  additionalInfo?: string | null;
  format: MusicFormat;
}

export interface MusicWantListItem {
  id: number;
  artist: string;
  title: string;
  format: MusicFormat;
}

export interface MetalArchivesBandSearchResult {
  metalArchivesId: string;
  name: string;
  country: string;
  genre: string;
  url: string;
}

export interface MusicMetalArchivesReleaseComparison {
  metalArchivesId: string;
  title: string;
  releaseType: string;
  year?: number | null;
  url: string;
  status: 'Missing' | 'Owned' | 'Wanted' | string;
  matchedTitle?: string | null;
  matchedAlbumId?: number | null;
  matchNote?: string | null;
  selected: boolean;
}

export interface MusicMetalArchivesComparison {
  band: MetalArchivesBandSearchResult;
  releases: MusicMetalArchivesReleaseComparison[];
}

export interface MusicMetalArchivesManualCompareRequest {
  artistName: string;
  releases: Array<{
    metalArchivesId: string;
    title: string;
    releaseType: string;
    year?: number | null;
    url: string;
  }>;
}

export interface MusicMetalArchivesAddWantRequest {
  artistName: string;
  releases: Array<{
    title: string;
    releaseType: string;
    year?: number | null;
    url?: string | null;
    metalArchivesId?: string | null;
  }>;
}

export interface MusicMetalArchivesAddWantResult {
  createdCount: number;
  skippedCount: number;
  messages: string[];
}
