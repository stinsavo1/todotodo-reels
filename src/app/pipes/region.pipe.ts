import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@Pipe({
    name: 'regionPipe',
    standalone: false
})

export class RegionPipe implements PipeTransform {
  transform(value: number, regions: any): number | null {
    if (value === undefined) return null;
    if (regions) {
      return regions.regions.find((x: any) => x.id === value).value;
    }
    return value;
  }
}
