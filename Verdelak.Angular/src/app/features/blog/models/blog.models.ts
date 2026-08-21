export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  postedDate: string;
  status: string;
  isPublic: boolean;
  tags: BlogTag[];
}

export interface BlogPostDetail {
  id: number;
  title: string;
  slug: string;
  bodyMarkdown: string;
  postedDate: string;
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tags: BlogTag[];
}

export interface BlogArchiveMonth {
  year: number;
  month: number;
  count: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BlogPostSaveRequest {
  title: string;
  slug?: string | null;
  bodyMarkdown: string;
  postedDate: string;
  status: string;
  isPublic: boolean;
  tags: string[];
}
