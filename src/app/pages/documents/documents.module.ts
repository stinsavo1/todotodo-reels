import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DocumentsPage } from './documents.page';
import { DocumentsRoutingModule } from './documents-routing.module';
import { AboutProjectComponent } from './about-project/about-project.component';
import { PersonalDataPolicyComponent } from './personal-data-policy/personal-data-policy.component';
import { PersonalPolicyComponent } from './personal-policy/personal-policy.component';
import { FeedbackServiceComponent } from './feedback-service/feedback-service.component';
import { CookiesComponent } from './cookies/cookies.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DocumentsRoutingModule
  ],
  declarations: [DocumentsPage, AboutProjectComponent, PersonalDataPolicyComponent, PersonalPolicyComponent, FeedbackServiceComponent, CookiesComponent]
})
export class DocumentsModule {
}
