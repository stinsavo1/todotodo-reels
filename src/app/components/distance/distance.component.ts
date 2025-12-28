import { Component, Input, NgZone, OnInit, SimpleChanges } from '@angular/core'
import { MapService } from 'src/app/services/map.service'

@Component({
    selector: 'app-distance',
    templateUrl: './distance.component.html',
    styleUrls: ['./distance.component.scss'],
    standalone: false
})
export class DistanceComponent implements OnInit {
  public distance: string
  @Input() geometry: number[] = [0, 0]
  @Input() center: number[] = [0, 0]

  ngOnChanges (changes: SimpleChanges) {
    if (this.center[0] != 0 && this.geometry[0] != 0) {
      this.ngZone.run(() => {
        const distanceMeter = this.mapService.getDistance(
          this.center,
          this.geometry
        )
        if (distanceMeter < 1000)
          this.distance = Math.round(distanceMeter) + 'м'
        else if (distanceMeter > 10000)
          this.distance = Math.round(distanceMeter / 1000) + 'км'
        else this.distance = Math.round(distanceMeter / 100) / 10 + 'км'
      })
    }
  }

  constructor (private mapService: MapService, private ngZone: NgZone) {
    this.distance = '-км'
  }

  ngOnInit () {}
}
