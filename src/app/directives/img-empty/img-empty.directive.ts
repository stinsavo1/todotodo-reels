import {Directive, ElementRef, Input, OnInit} from '@angular/core';

@Directive({
    selector: '[src]',
    standalone: false
})
export class ImgEmptyDirective implements OnInit {
  @Input() src!: string;
  @Input() emptyImage!: string;

  constructor(private readonly elementRef: ElementRef) {
  }

  ngOnInit() {
    this.elementRef.nativeElement.src = this.src || this.emptyImage;
  }
}
