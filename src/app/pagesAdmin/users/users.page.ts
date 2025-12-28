import { Component, OnInit, ViewChild } from '@angular/core'
import { FormatDatePipe } from '../../pipes/format-date.pipe';
import { ModalController } from '@ionic/angular';
import { EditCommentModalComponent } from './edit-comment-modal.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { UserInterface } from '../../interfaces/user.interface';
import * as XLSX from 'xlsx';
import moment from 'moment/moment';
import { take } from "rxjs";
import { AuthService } from "../../services/auth.service";
import { environment } from "../../../environments/environment";
import { UserNewRoleEnum } from "../../enums/users-mode.enum";
import { AdminService } from "../../services/my-service/admin.service";
import { RegionEnum } from "../../enums/regions.enum";
export const regions = [
  { id: RegionEnum.Moscow, name: 'Москва' },
  { id: RegionEnum.SaintPetersburg, name: 'Санкт-Петербург' },
  { id: RegionEnum.Krasnodar, name: 'Краснодарский край' },
  { id: RegionEnum.Rostov, name: 'Ростовская область' },
  { id: RegionEnum.Chernozemye, name: 'Черноземье' },
  { id: RegionEnum.NizhnyNovgorod, name: 'Нижегородская область' },
  { id: RegionEnum.Saratov, name: 'Саратовская область' },
  { id: RegionEnum.Samara, name: 'Самарская область' },
  { id: RegionEnum.Tatarstan, name: 'Татарстан' },
  { id: RegionEnum.Stavropol, name: 'Ставропольский край' },
  { id: RegionEnum.Ural, name: 'Урал'},
  { id: RegionEnum.Volgograd, name: 'Волгоградская область'},
  { id: RegionEnum.VladimirObl, name: 'Владимирская область'},
  { id: RegionEnum.SmolenskObl, name: 'Смоленская область'},
  { id: RegionEnum.Other, name: 'Другое' },
];

// Создаем мапу для быстрого поиска региона по id
const regionMap = regions.reduce((acc, region) => {
  acc[region.id] = region.name;
  return acc;
}, {} as Record<number, string>);
@Component({
    selector: 'app-users',
    templateUrl: './users.page.html',
    styleUrls: ['./users.page.scss'],
    standalone: false
})

export class UsersPage implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  public sortField: string = 'createDate';
  public sortDirection: 'asc' | 'desc' = 'desc';
  public loading: boolean = false;
  public hoveredRow: UserInterface | null = null;
  public displayedColumns: string[] = ['fio', 'phone', 'email', 'role', 'region', 'createDate', 'lastInactiveTime', 'finishPeriod', 'commentAdmin'];
  public dataSource: MatTableDataSource<UserInterface> = new MatTableDataSource();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  public search!: string;
  public allUsers = [];
  private userNewRoleEnum = UserNewRoleEnum;

  totalSize = 0; // Общее количество элементов
  pageSize = 20; // Размер страницы
  pageIndex = 0; // Текущая страница
  users: any[] = []; // Полный массив пользователей
  originalUsers: any[] = [];

  constructor(private authService: AuthService,
              private formatDatePipe: FormatDatePipe,
              private router: Router,
              private adminService: AdminService,
              private modalCtrl: ModalController) {
  }

  public getRegionName(id: number) {
    const region = regions.find(r => r.id === id);
    return region ? region.name : 'Регион не найден';
  }

  public searchFilter(value: string): void {
    this.loading = true;
    this.pageIndex = 0;
    const isAdmin = this.authService.isAdmin;
    if (value && isAdmin) {
      this.users = this.allUsers.filter((x) =>
        x.phone && x.phone.includes(value)
      ).map((user) => ({
        ...user,
        createDate: this.formatDatePipe.transform(user.createDate || user.createdAt),
      }));
    } else {
      this.users = this.allUsers.map((user) => ({
        ...user,
        createDate: this.formatDatePipe.transform(user.createDate || user.createdAt),
      }));
      this.sortPage();
    }
    if (value.length >= 12) {
      this.users = this.allUsers.filter((x) =>
        x.phone && x.phone.includes(value)
      ).map((user) => ({
        ...user,
        createDate: this.formatDatePipe.transform(user.createDate || user.createdAt),
      }));
    } else {
      this.users = this.originalUsers.map((user) => ({
        ...user,
        createDate: this.formatDatePipe.transform(user.createDate || user.createdAt),
      }));
      this.sortPage();
    }
    this.updateDataSource();
    this.loading = false;
  }

  async openModal(item: UserInterface, title: string) {
    const modal = await this.modalCtrl.create({
      component: EditCommentModalComponent,
      componentProps: { comment: item.commentAdmin, title: title, }, // Передача текущего комментария
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        item.commentAdmin = result.data;
        const modal = JSON.parse(JSON.stringify(item));
        delete modal.createDate;
        this.authService.savePageAdmin(item.id, item.email, modal);
      }
    });

    await modal.present();
  }

  public deleteComment(item: UserInterface): void {
    delete item.commentAdmin;
    const modal = JSON.parse(JSON.stringify(item));
    delete modal.createDate;
    this.authService.savePageAdmin(item.id, item.email, modal);
  }

  ngOnInit() {
    this.loadUsers();
  }

  public async exportToExcel(): Promise<void> {
    this.loading = true;
    const isAdmin = this.authService.isAdmin;
    const isModerators = this.authService.isModerators;
    const isRegionModerators = this.authService.regionModerators;
    this.authService.users().pipe(take(2)).subscribe((res: any[]) => {
      if (res.length > 1) {

        let withPhone = [];

        if (this.authService.uid === environment.adminUid) {
          withPhone = res.filter((x) => x.phone)
        } else {
        }

        if (isAdmin) {
          withPhone = res.filter((x) => x.phone)
        } else if (isModerators) {
          withPhone = res.filter((x) => (x.role !== this.userNewRoleEnum.INSTALLER && x.role !== this.userNewRoleEnum.CLIENT) && x.phone)
        } else if (isRegionModerators) {
          withPhone = res.filter((x) => (x.region === isRegionModerators.region) && x.phone)
        }

        // Подготовка данных
        const excelDataPhone = withPhone.map(user => {
          const regionName = regionMap[user.regionId] || '-';

          // Проверка даты окончания подписки
          const finishPeriodDate = user.finishPeriod ? moment(user.finishPeriod) : null;
          const formattedFinishPeriod = finishPeriodDate && finishPeriodDate.isValid()
            ? finishPeriodDate.format('DD.MM.YYYY')
            : '-';

          return {
            'ФИО': user.fio ?? '-',
            'Телефон': user.phone ?? '-',
            'Почта': user.email ?? '-',
            'Роль': user.role ?? '-',
            'Регион': regionName,
            'Дата регистрации': this.formatUserDate(user),
            'Дата входа': user?.lastInactiveTime ?? '-',
            'Подписка': formattedFinishPeriod,
            'Комментарий': user.commentAdmin ?? '-',
          };
        });

        const wsPhone: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelDataPhone);
        wsPhone['!cols'] = [
          { wch: 25 },  // ФИО
          { wch: 15 },  // Телефон
          { wch: 25 },  // Почта
          { wch: 15 },  // Роль
          { wch: 20 },  // Регион
          { wch: 20 },  // Дата регистрации
          { wch: 20 },  // Дата входа
          { wch: 15 },  // Подписка
          { wch: 30 },  // Комментарий
        ];
        const wbPhone: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbPhone, wsPhone, 'Пользователи');

        // Сохранение файла
        const wboutPhone: ArrayBuffer = XLSX.write(wbPhone, { bookType: 'xlsx', type: 'array' });
        const blobPhone = new Blob([wboutPhone], { type: 'application/octet-stream' });
        const urlPhone = window.URL.createObjectURL(blobPhone);
        const aPhone = document.createElement('a');
        aPhone.href = urlPhone;
        aPhone.download = 'Пользователи.xlsx';
        aPhone.click();
        window.URL.revokeObjectURL(urlPhone);
        this.loading = false;
      }
    });
  }
  // Метод для загрузки данных пользователей
  public loadUsers(): void {
    this.loading = true;
    const isAdmin = this.authService.isAdmin;
    const isModerators = this.authService.isModerators;
    const isRegionModerators = this.authService.regionModerators;

    this.adminService.getAllUsers().then(users => {
      this.allUsers = users;
      if (isModerators) {
        this.updateUsersData(users.filter((user) => user.role !== this.userNewRoleEnum.INSTALLER && user.role !== this.userNewRoleEnum.CLIENT));
      }
      if (isAdmin) {
        this.updateUsersData(users);
      }
      if (isRegionModerators) {
        this.updateUsersData(users.filter((user) => user.region === isRegionModerators.region));
      }
    })
  }

  private updateUsersData(users: any): void {
      this.users = users.map((user: any) => ({
        ...user,
        createDate: this.formatDatePipe.transform(user.createDate || user.createdAt),
      }));
      this.sortPage();
      this.originalUsers = JSON.parse(JSON.stringify(users));

      this.updateDataSource();
      this.loading = false;
  }

  private parseDate(dateStr: string): Date {
    const dateOnly = dateStr.split(' ')[0];

    const [day, month, year] = dateOnly.split('.').map(Number);
    return new Date(year, month - 1, day); // Месяцы в JS начинаются с 0
  }

  // Метод для обновления данных в dataSource
  private updateDataSource(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.totalSize = this.users.length; // Установка общего количества элементов
    this.dataSource.data = this.users.slice(start, end); // Берем подмассив для текущей страницы
  }

  private sortPage(): void {
      const active = this.sortField;
      const direction = this.sortDirection;

      this.users.sort((a, b) => {
        if (!active) return 0;

        const isValidA = a[active] && /\d{2}\.\d{2}\.\d{4}/.test(a[active]);
        const isValidB = b[active] && /\d{2}\.\d{2}\.\d{4}/.test(b[active]);

        if (!isValidA && !isValidB) return 0;
        if (!isValidA) return 1;
        if (!isValidB) return -1;

        const dateA = this.parseDate(a[active]);
        const dateB = this.parseDate(b[active]);

        // @ts-ignore
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    // this.users.sort((a, b) => {
    //   const isValidDateA = a.createDate && /\d{2}\.\d{2}\.\d{4}/.test(a.createDate);
    //   const isValidDateB = b.createDate && /\d{2}\.\d{2}\.\d{4}/.test(b.createDate);
    //
    //   // Если оба пользователя имеют корректные даты — сравниваем даты
    //   if (isValidDateA && isValidDateB) {
    //     const dateA = this.parseDate(a.createDate);
    //     const dateB = this.parseDate(b.createDate);
    //     // @ts-ignore
    //     return dateB - dateA; // Сортировка по убыванию даты
    //   }
    //
    //   // Если только у a корректная дата, то он идет раньше
    //   if (isValidDateA) return -1;
    //
    //   // Если только у b корректная дата, то он идет раньше
    //   if (isValidDateB) return 1;
    //
    //   // Если оба имеют некорректные даты — сохраняем их порядок
    //   return 0;
    // });

  // Обработчик событий пагинации
  onPaginateChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDataSource(); // Обновляем данные при изменении страницы
  }

  // Обработчик изменения сортировки
  public onSortChange(): void {
    this.sortField = this.sort.active;
    this.sortDirection = this.sort.direction as 'asc' | 'desc';
    this.loadUsers();
  }

  public navigateProfileDetails(row: UserInterface): void {
    this.router.navigate(['/admin/tabs/users/user/', row.id]);
  }

  public addUser(): void {
    this.router.navigate(['/admin/tabs/users/add-user']);
  }

  private formatUserDate(user: any) {
    // Определяем исходный timestamp
    let timestamp;

    if (user.createDate) {
      if (user.createDate.seconds) {
        timestamp = user.createDate.seconds * 1000 + Math.floor(user.createDate.nanoseconds / 1000000);
      } else {
        timestamp = user.createDate;
      }
    } else if (user.createdAt) {
      if (user.createdAt.seconds) {
        timestamp = user.createdAt.seconds * 1000 + Math.floor(user.createdAt.nanoseconds / 1000000);
      } else {
        timestamp = user.createdAt;
      }
    } else {
      return "-";
    }

    // Создаем объект Date
    const date = new Date(timestamp);

    // Проверяем валидность даты
    if (isNaN(date.getTime())) return "Неверная дата";

    // Форматируем компоненты даты
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }
}
