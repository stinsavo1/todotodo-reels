import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[cursorPointer]'
})
export class CursorPointerDirective {

  constructor() { }
  @HostBinding('style.cursor') cursor = 'pointer';

}
