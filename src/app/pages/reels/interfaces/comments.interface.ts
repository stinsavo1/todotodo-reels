import { FieldValue } from '@firebase/firestore';

export interface ReelsComment {
  id: string;
  videoId: string,
  userId: string,
  username: string,
  text: string,
  createdAt: FieldValue,
}

export interface CommentsWithAvatar extends ReelsComment {
  avatar: string,
}
