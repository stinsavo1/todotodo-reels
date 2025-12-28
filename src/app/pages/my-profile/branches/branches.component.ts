import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MapService } from '../../../services/map.service';
import { Branch, BranchesService } from "../../../services/my-service/branches.service";
import { AuthService } from "../../../services/auth.service";
import { UserService } from "../../../services/my-service/user.service";
import { v4 as uuidv4 } from 'uuid';

@Component({
    selector: 'app-branches',
    templateUrl: './branches.component.html',
    styleUrls: ['./branches.component.scss'],
    standalone: false
})
@UntilDestroy()
export class BranchesComponent implements OnInit, OnDestroy {
  @ViewChild('newBranches') newBranches: any;

  public showToast: boolean = false;
  public errorMessage: string = 'Пожалуйста, заполните все обязательные поля'
  public hasError: boolean = false;
  public isAddressSelected: boolean = false;
  public address: string;
  public name: string;
  public branches: any[] = [];
  public branch: Branch;
  public searchAddressList$: Observable<{ [key: string]: any }[]>;
  public loading: boolean = true;
  public user: any;
  private searchAddress$: ReplaySubject<string>;

  constructor(private mapService: MapService,
              private authService: AuthService,
              private userService: UserService,
              private branchesService: BranchesService) {}

  public ngOnInit() {
    this.getUser();
    this.searchAddress$ = new ReplaySubject(1);
    this.searchAddressList$ = this.mapService.suggest(this.searchAddress$).pipe(untilDestroyed(this));
  }

  ngOnDestroy() {
    this.searchAddress$.unsubscribe();
  }

  public openModal(): void {
    this.reset();
    this.newBranches.present();
  }

  public onChangeAddress(e: CustomEvent): void {
    this.searchAddress$.next( e.detail.value);
    this.isAddressSelected = false;
  }

  public selectAddress(text: string): void {
    this.address = text;
    this.searchAddress$.next('');
    this.isAddressSelected = true;
  }

  public openModalEdit(branch: Branch): void {
    this.address = branch.address;
    this.name = branch.name;
    this.branch = branch;
    this.newBranches.present();
  }

  public addBranch(): void {
    if (!this.address || !this.name) {
      this.hasError = true;
      this.showToast = true;
      return;
    }
    if (!this.isAddressSelected) {
      this.showToast = true;
      this.hasError = true;
      this.errorMessage = 'Пожалуйста, выберите адрес';
      return;
    }
    this.mapService.geoCoder(this.address).then((result) => {
      if (this.branch) {
        this.branchesService.updateBranchInUser(this.authService.uid, this.user.mode, {
          address: this.address,
          name: this.name,
          geometry: result,
          id: this.branch.id
        }).then();
      } else {
        this.branchesService.addBranchToUser(this.authService.uid, this.user.mode, {
          address: this.address,
          name: this.name,
          geometry: result,
          id: uuidv4()
        }).then();
      }

      this.closeModal();
    });
  }

  public closeModal(): void {
    this.reset();
    this.newBranches.dismiss();
  }

  public closeToast(): void {
    this.showToast = false;
  }

  public delete(id: string): void {
    this.branchesService.removeBranchFromUser(this.authService.uid, this.user.mode, id).then();
  }

  private reset(): void {
    this.address = null;
    this.name = null;
    this.hasError = false;
    this.branch = null;
    this.isAddressSelected = false;
  }

  private getUser(): void {
    this.userService.getUserById(this.authService.uid).subscribe(user => {
      this.loading = false;
      if (user.mode === 'factory') {
        this.branches = user?.branchesFactory;
      }
      if (user.mode === 'store') {
        this.branches = user?.branches;
      }
      this.user = user;
    });
  }
}
