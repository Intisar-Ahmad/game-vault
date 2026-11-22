export interface IgdbSearchResult {
  igdbId: number;
  title: string;
  slug: string;
  releaseYear: number | null;
  summary: string | null;
  coverUrl: string | null;
  backdropUrl: string | null;
  screenshots: string[];
  genres: string[];
  themes: string[];
  similarIgdbIds: number[];
  inLibrary: boolean;
  inWantToPlay: boolean;
}

export interface LibraryGameItem {
  id: number;
  igdbId: number;
  title: string;
  slug: string;
  releaseYear: number | null;
  summary: string | null;
  coverUrl: string | null;
  backdropUrl: string | null;
  screenshots: string[];
  genres: string[];
  themes: string[];
  similarIgdbIds: number[];
  rating: number | null;
  notes: string | null;
  playedAt: string;
  createdAt: string;
}

export interface WantToPlayItem {
  id: number;
  igdbId: number;
  title: string;
  slug: string;
  releaseYear: number | null;
  summary: string | null;
  coverUrl: string | null;
  backdropUrl: string | null;
  screenshots: string[];
  genres: string[];
  themes: string[];
  similarIgdbIds: number[];
  note: string | null;
  createdAt: string;
}