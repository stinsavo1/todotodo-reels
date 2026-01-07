import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResizeService {
  currensSizeOfScreen$ =new BehaviorSubject<number>(0)
}
