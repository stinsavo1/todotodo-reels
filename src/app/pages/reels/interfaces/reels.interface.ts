import { FieldValue } from '@firebase/firestore';

export interface Reel {
  id: string;
  url: string;
  userId: string;
  userName: string;
  description?: string;
  createdAt: FieldValue;
  likesCount: number;
  likes: string[];
  commentsCount: number;
  viewsCount:number;
}

export interface UserPreferences {
  blockedAuthors: Set<string>,
  hiddenVideos: Set<string>
}

export const MAX_SIZE_FILE = 35;
export const MAX_SIZE_COMMENT=500;
export const DOWLOAD_LIMIT=5;
export const TELEGRAM_TOKEN='';
export const TELEGRAM_CHAT_ID='';
