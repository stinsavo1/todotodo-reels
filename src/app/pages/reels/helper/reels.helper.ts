import { Reel } from '../interfaces/reels.interface';

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

  static renderSlide(slide:Reel, index: number): string {
    console.log('REN', slide.id, index, slide.description);
    return `
<div class="swiper-slide" id="container-${index}">
  <video
    id="${slide.id}"
    src="${slide.url}"
    
    class="reels-video"
    loop
    type="video/mp4"
    webkit-playsinline
    playsinline
    muted
    preload="auto"
    >
  </video>
  <div class="video-progress-container">
        <div class="video-progress-bar" ></div>
  </div>
</div>`;
  }

}
