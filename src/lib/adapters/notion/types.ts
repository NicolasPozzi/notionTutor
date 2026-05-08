export interface NotionPage {
  id: string;
  title: string;
  icon: string | null;
  lastEditedAt: string;
  url: string;
}

export interface NotionPageContent {
  pageId: string;
  title: string;
  content: string; // Plain text extracted from blocks
}

export interface NotionPagesResult {
  pages: NotionPage[];
  hasMore: boolean;
  nextCursor: string | null;
}
