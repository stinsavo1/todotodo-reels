import { Component, Input, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'

@Component({
    selector: 'app-full-image',
    templateUrl: './full-image.page.html',
    styleUrls: ['./full-image.page.scss'],
    standalone: false
})
export class FullImagePage implements OnInit {
  @Input() image: string = ''
  @Input() isReadOnly: boolean = true
  @Input() fnRemove: any = null

  constructor (public modalController: ModalController) {}

  ngOnInit () {}

  removeFile () {
    console.log('удаление')
    this.fnRemove(this.image)
    this.modalController.dismiss()
  }
}
