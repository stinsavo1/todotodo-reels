import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqComponent } from './faq.component';
import { FaqRoutingModule } from './faq-routing.module';
import { JoditAngularModule } from 'jodit-angular';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FaqWatchComponent } from './faq-watch/faq-watch.component';

@NgModule({
  imports: [
    CommonModule,
    FaqRoutingModule,
    IonicModule,
    JoditAngularModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [FaqComponent, FaqWatchComponent]
})
export class FaqModule {}
