import { Component, OnInit } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UserInterface, UserWithRegion } from '../../../interfaces/user.interface';
import { FormatDatePipe } from '../../../pipes/format-date.pipe';
import { UserService } from '../../../services/my-service/user.service';
import { regions } from '../../users/users.page';
import { BlogersService } from '../blogers.service';


@Component({
  selector: 'app-blogers',
  templateUrl: './blogers.component.html',
  styleUrls: ['./blogers.component.scss'],
  standalone:false

})
export class BlogersComponent  implements OnInit {
  blogers: UserWithRegion[]=[];
  public sortField: string;
  public loading=false;
  public sortDirection:'asc' | 'desc' = 'desc';
  public displayedColumns: string[] = ['fio', 'phone', 'subscribersCount','subscribtionsCount','regionName'];
  public totalSize: number = 0;
  public pageSize: number = 10;
  public pageIndex: number=0;
  public search:string='';

  constructor(private userService:UserService,
              private router:Router,
              private blogersService:BlogersService) { }

  ngOnInit() {
    this.loading=true;
    this.userService.getUsers([where('isBloger', '==', true)]).pipe(finalize(()=>this.loading=false)).subscribe({
      next: (data) => {
        this.blogers=this.addNewProperty(data);
        this.totalSize = data.length;
      }
    })
  }

  addNewProperty(blogers:UserInterface[]): UserWithRegion[]{
   return blogers.map((bloger)=>{
      return {...bloger, nameRegion: this.getRegionName(bloger.region)}
    })
  }


  public navigateProfileDetails(row: UserWithRegion): void {
    this.router.navigate(['/admin/tabs/blogers/bloger/', row.id]);
  }




  private getRegionName(id: number):string {
    const region = regions.find(r => r.id === id);
    return region ? region.name : 'Регион не найден';
  }
}
