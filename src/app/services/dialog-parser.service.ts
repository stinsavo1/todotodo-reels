import { Injectable } from '@angular/core';

export interface DialogParts {
  authorId: string;
  userId: string;
  orderId: string;
}

@Injectable({providedIn: 'root'})
export class DialogParserService {

  parseDialogId(token: string): DialogParts | null {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('_');

    if (parts.length !== 3) {
      return null;
    }

    const [authorId, userId, orderId] = parts;

    if (!authorId || !userId || !orderId) {
      return null;
    }

    return { authorId, userId, orderId };
  }

}
