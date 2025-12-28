import { Component } from '@angular/core'
import { FeedbackService } from '../../../services/my-service/feedback.service';

@Component({
    selector: 'app-feedback-service',
    templateUrl: './feedback-service.component.html',
    styleUrls: ['./feedback-service.component.scss'],
    standalone: false
})
export class FeedbackServiceComponent {

  formData = {
    name: '',
    message: ''
  };

  constructor(private feedbackService: FeedbackService) {}

  onSubmit() {
    if (this.formData.name && this.formData.message) {
      this.feedbackService.sendFeedbackService({
        name: this.formData.name,
        message: this.formData.message,
        createdAt: new Date()
      });

      alert('Спасибо за ваше предложение! Мы обязательно его рассмотрим.');

      this.formData = {
        name: '',
        message: ''
      };
    }
  }
}
