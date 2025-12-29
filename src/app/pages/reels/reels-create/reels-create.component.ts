import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth.service';
import { VideoService } from '../../../services/video.service';

@Component({
  selector: 'app-reels-create',
  templateUrl: './reels-create.component.html',
  styleUrls: ['./reels-create.component.scss'],
  standalone: false
})
export class ReelsCreateComponent implements OnInit {
  @ViewChild('fInput') fInput: ElementRef;
  @Input() isOpenCreateModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  public description: string | null = null;
  isProcessing: boolean = false;


  constructor(public videoService: VideoService, private auth: Auth) {
  }

  ngOnInit() {

  }

  public dismiss(): void {
   this.deleteVideo();
    this.closeModal.emit();
  }

  public createReels(): void {
    this.videoService.onPublish(this.description).then(()=>{this.closeModal.emit();});

  }

  uploadVideo(event: any) {
    this.videoService.uploadVideo(event,this.auth.currentUser.uid).then();
  }

  public deleteVideo(): void {
    const uploadedVideoUrl = this.videoService.uploadedVideoUrl$.value;
    if (uploadedVideoUrl) {
      this.videoService.deleteFileFromStorage(uploadedVideoUrl).then();
      this.videoService.uploadedVideoUrl$.next(null);
    }
    if (this.fInput) {
      this.fInput.nativeElement.value = '';
    }
  }
}
