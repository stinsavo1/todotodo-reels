import { Pipe, PipeTransform } from '@angular/core'
import orderBy from 'lodash-es/orderBy'

@Pipe({
    name: 'orderBy',
    standalone: false
})
export class OrderByPipe implements PipeTransform {
  transform (array: any, sortBy: string, order: 'asc' | 'desc' = 'asc'): any[] {
    return orderBy(array, [sortBy], order)
  }
}
