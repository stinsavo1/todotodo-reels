import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { DocumentsPage } from './documents.page'
import { AboutProjectComponent } from './about-project/about-project.component';
import { PersonalDataPolicyComponent } from './personal-data-policy/personal-data-policy.component';
import { PersonalPolicyComponent } from './personal-policy/personal-policy.component';
import { FeedbackServiceComponent } from './feedback-service/feedback-service.component';
import { CookiesComponent } from './cookies/cookies.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentsPage,
  },
  {
    path: 'about-project',
    component: AboutProjectComponent
  },
  {
    path: 'personal-data-policy',
    component: PersonalDataPolicyComponent
  },
  {
    path: 'personal-policy',
    component: PersonalPolicyComponent
  },
  {
    path: 'feedback-service',
    component: FeedbackServiceComponent
  },
  {
    path: 'cookies',
    component: CookiesComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentsRoutingModule {}
