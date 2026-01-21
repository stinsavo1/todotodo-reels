import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { UserById, UserWithRegion } from '../../../interfaces/user.interface';
import { BlogersService } from '../blogers.service';

@Component({
  selector: 'app-view-details',
  templateUrl: './view-details.component.html',
  styleUrls: ['./view-details.component.scss'],
  imports: [

    IonicModule
  ]
})
export class ViewDetailsComponent  implements OnInit {
@Input() list:string[]=[]
@Input() title:string=''
  users:UserWithRegion[]=[]

  constructor(public modalController:ModalController,private blogersService:BlogersService) { }

  ngOnInit() {
    this.list.forEach((el)=>{
      const user= this.blogersService.usersById[el];
      if (user) {

      this.users.push(user)
      }
    })
  }

}
