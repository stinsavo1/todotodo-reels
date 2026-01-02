
export class ReelsHelper {
  static sanitizeText(text: string): string {
    if (!text) return '';

    return text
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
