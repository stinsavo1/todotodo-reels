import { Injectable, NgZone } from '@angular/core'
import { YaApiLoaderService } from 'angular8-yandex-maps'
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  debounce,
  first,
  interval,
  map,
  of,
  switchMap,
  tap
} from 'rxjs'
import axios from 'axios'
import { AddressInterface } from '../interfaces/address.interface';
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public center: string
  public centerArray: number[]
  public center$: BehaviorSubject<number[]>
  public readyMap$: ReplaySubject<any>

  constructor (
    private yaApiLoaderService: YaApiLoaderService,
    private ngZone: NgZone
  ) {
    this.center = ''
    this.centerArray = [0, 0]
    this.center$ = new BehaviorSubject([0, 0])
    this.readyMap$ = new ReplaySubject()
    this.yaApiLoaderService.load().subscribe(item =>
      this.ngZone.run(() => {
        this.readyMap$.next({
          ymap: item
        })
      })
    )
  }

  async geoCoderURI (uri: string) {
    const result = await axios.get(
      `https://geocode-maps.yandex.ru/1.x?` +
        `apikey=${environment.apikeyYandexMap}&format=json&uri=${uri}`
    )
    return result.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
      .split(' ')
      .reduce((acc: number[], item: string) => {
        acc.unshift(Number(item))
        return acc
      }, [])
  }

  async geoCoder (address: string) {
    const result = await axios.get(
      `https://geocode-maps.yandex.ru/1.x?` +
        `apikey=${environment.apikeyYandexMap}&format=json&geocode=${address}`
    )
    return result.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
      .split(' ')
      .reduce((acc: number[], item: string) => {
        acc.unshift(Number(item))
        return acc
      }, [])
  }

  getMyPossition (): Observable<string> {
    return new Observable(observer => {
      ymaps.geolocation.get({}).then(result => {
        const geometry = (
          result.geoObjects.get(0).geometry as any
        )?.getCoordinates()
        observer.next(geometry[1] + ',' + geometry[0])
      })
    })
  }

  suggestWithoutDebounce (
    searchAddress$: Observable<string>
  ): Observable<{ [key: string]: any }[]> {
    return searchAddress$.pipe(
      switchMap(search =>
        search.length <= 3
          ? of({ data: { result: [] } })
          : this.getMyPossition().pipe(
            switchMap(position =>
              axios.get(
                `https://suggest-maps.yandex.ru/v1/suggest?` +
                `apikey=${environment.apikeySuggest}&results=5&types=house&attrs=uri` +
                `&spn=0.5,0.3` +
                `&print_address=1&ll=${position}&text=${search}`
              )
            )
          )
      ),
      map(res =>
        (res.data.results || []).map((item: { [key: string]: any }) => ({
          title: item['title']['text'],
          subtitle: item['subtitle'] && item['subtitle']['text'],
          formatted_address: item['address']['formatted_address'],
          uri: item['uri']
        }))
      )
    )
  }

  suggest (
    searchAddress$: Observable<string>
  ): Observable<AddressInterface[]> {
    return searchAddress$.pipe(
      debounce(search => interval(search.length <= 3 ? 0 : 1000)),
      switchMap(search =>
        search.length <= 3
          ? of({ data: { result: [] } })
          : this.getMyPossition().pipe(
              switchMap(position =>
                axios.get(
                  `https://suggest-maps.yandex.ru/v1/suggest?` +
                    `apikey=${environment.apikeySuggest}&results=5&types=house&attrs=uri` +
                    `&spn=0.5,0.3` +
                    `&print_address=1&ll=${position}&text=${search}`
                )
              )
            )
      ),
      map(res =>
        (res.data.results || []).map((item: { [key: string]: any }) => ({
          title: item['title']['text'],
          subtitle: item['subtitle'] && item['subtitle']['text'],
          formatted_address: item['address']['formatted_address'],
          uri: item['uri']
        }))
      )
    )
  }

  getDistance (point1: number[], point2: number[]): number {
    if (point1[0] == 0 && point1[1] == 0) return 0
    try {
      return (ymaps as any).coordSystem.geo.getDistance(point1, point2)
    } catch (error) {
      return 0
    }
  }
}
