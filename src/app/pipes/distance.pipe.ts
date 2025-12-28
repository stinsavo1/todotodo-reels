import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
    name: 'distance',
    standalone: false
})
export class DistancePipe implements PipeTransform {
  transform (distanceMeter: number, ...args: unknown[]): unknown {
    if (distanceMeter < 1000) return Math.round(distanceMeter) + 'м'
    else if (distanceMeter > 10000)
      return Math.round(distanceMeter / 1000) + 'км'
    else return Math.round(distanceMeter / 100) / 10 + 'км'
  }
}
