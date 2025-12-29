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
