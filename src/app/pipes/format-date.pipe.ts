import { Injectable, Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
    name: 'formatDate',
    standalone: false
})
@Injectable({ providedIn: 'root' })
export class FormatDatePipe implements PipeTransform {

  transform(value: any, format?: string): string {
    if (value?.seconds && value?.nanoseconds) {
      const milliseconds = (value.seconds * 1000) + (value.nanoseconds / 1000000);
      return moment(milliseconds).format(format ? format :'DD.MM.YYYY');
    } else if (value) {
      return moment(value).format(format ? format :'DD.MM.YYYY');
    }
    return '';
  }
}
