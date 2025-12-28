import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import {
  IonButton,
  IonButtons,
  IonCard,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonList,
  IonProgressBar,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import { ActivatedRoute } from "@angular/router";
import { ChatService } from "../../../services/chat.service";
import { DialogParserService, DialogParts } from "../../../services/dialog-parser.service";
import { AuthService } from "../../../services/auth.service";
import { UserInterface } from "../../../interfaces/user.interface";
import { AsyncPipe, CommonModule, DatePipe } from "@angular/common";
import { SharedModule } from "../../../components/shared.module";
import { from, map, Observable, of, switchMap, take } from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NgxIonicImageViewerModule } from "@herdwatch/ngx-ionic-image-viewer";
import { FormsModule } from "@angular/forms";
import { NavController, ToastController, ViewWillEnter } from "@ionic/angular";
import { UsersModeEnum } from "../../../enums/users-mode.enum";
import { CapitalizePipe } from "../../../pipes/capitalize.pipe";
import moment from "moment";
import { CoreService } from "../../../services/core.service";
import { PaymentService } from "../../../services/payment.service";
import { PhoneMaskPipe } from "../../../pipes/phone-mask.pipe";
import { UploadFileService } from "../../../services/upload-file.service";
import { OrdersService } from "../../../services/orders.service";
import { OrderStatusEnum } from "../../../enums/order-status.enum";
import { toMoscowDate } from "../../../components/utils/functions";
import { LeadService } from "../../../services/lead.service";
import { EventService } from "../../../services/my-service/event.service";
import { PushNewEmailService } from "../../../services/my-service/push-new-email.service";
import { Functions, httpsCallable } from "@angular/fire/functions";

interface SelectedFile {
  name: string;
  file: File;
  preview?: string;
  isImage: boolean;
}


@Component({
  selector: 'app-new-chat',
  templateUrl: './new-chat.component.html',
  styleUrls: ['./new-chat.component.scss'],
  imports: [
    IonHeader,
    IonButtons,
    IonToolbar,
    IonTitle,
    SharedModule,
    IonContent,
    IonList,
    AsyncPipe,
    DatePipe,
    CommonModule,
    NgxIonicImageViewerModule,
    FormsModule,
    IonFooter,
    IonButton,
    IonProgressBar,
    IonChip,
    CapitalizePipe,
    IonCard
  ],
  providers: [DialogParserService, PushNewEmailService],
  standalone: true
})

@UntilDestroy()
export class NewChatComponent implements ViewWillEnter, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('autoResizeTextarea') textarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('myFooter', { static: false, read: ElementRef }) myFooterRef: ElementRef;
  @ViewChild('chatContent', { read: ElementRef }) chatContentEl!: ElementRef;

  public dialogParts: DialogParts;
  public dialogWithGroups$: Observable<any>;
  public user: any;
  public text: string;
  public loader = true;
  public selectedFiles: SelectedFile[] = [];
  public isActiveSubscribe: boolean | undefined = false;
  public disabledFooter = true;
  private userMode = UsersModeEnum;
  public orderStatus = OrderStatusEnum;
  private id: string;
  public dialog: any;
  public author: string;
  private order: any;
  private status: OrderStatusEnum | null;
  private initialScrollDone = false;
  private isManager: boolean;

  constructor(private route: ActivatedRoute,
              private dialogParserService: DialogParserService,
              public authService: AuthService,
              private toast: ToastController,
              private phoneMaskPipe: PhoneMaskPipe,
              private functions: Functions,
              private paymentService: PaymentService,
              private core: CoreService,
              private uploadFileService: UploadFileService,
              private orderService: OrdersService,
              private leadService: LeadService,
              private navCtrl: NavController,
              private pushNewEmailService: PushNewEmailService,
              private chatService: ChatService) {
  }

  ionViewWillEnter() {
    // this.chatService.fetchAndMarkExpiredAsRejected().then();
    this.id = this.route.snapshot.paramMap.get('id');
    this.dialogParts = this.dialogParserService.parseDialogId(this.id);
    this.isManager = this.route.snapshot.paramMap.get('isManager') === 'true';
    this.author = this.authService.uid
    if (this.isManager) {
      this.author = this.dialogParts.authorId;
    }
    this.paymentService.getStatusPayment().subscribe((res) => {
      this.isActiveSubscribe = res?.isActive;
    });
    this.dialogs();
    this.getUserAuthorDialog();
  }

  public openSupport(): void {
    window.location.href = 'https://wa.me/79889770777?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82!%20%D0%9C%D0%BD%D0%B5%20%D0%BD%D1%83%D0%B6%D0%BD%D0%B0%20%D0%BF%D0%BE%D0%BC%D0%BE%D1%89%D1%8C%20%D0%B2%20%D0%B2%D0%B0%D1%88%D0%B5%D0%BC%20%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D0%B5';
  }

  public dialogs(): void {
    this.dialogWithGroups$ = this.chatService.getDialogWithMessagesLive$(this.id).pipe(
      map(dialog => {
        if (!dialog) {
          this.orderService.order(this.dialogParts.orderId).pipe(
            switchMap(order => {
              if (order !== null) {
                return of(order);
              }
              // Иначе — делаем резервный запрос, например, alternativeOrder(id)
              return this.leadService.getDealById(this.dialogParts.orderId).pipe(
                map(altOrder => altOrder ?? null) // на случай, если и альтернатива не найдена
              );
            })
          ).subscribe(order => {
            this.order = order;
          });
          this.disabledFooter = false;
          return null
        }
        this.checkStatusFooter(dialog);

        this.chatService.markReadDialog(this.id, this.dialog || this.order).then();
        let groupMessages: any[] = [];

        // Группируем ТОЛЬКО если есть сообщения
        if (dialog.messages?.length) {
          const sortedMessages = [...dialog.messages].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const groups = new Map<string, { date: Date; messages: any[] }>();
          for (const msg of sortedMessages) {
            const date = new Date(msg.createdAt);
            const dateKey = date.toISOString().split('T')[0]; // '2025-11-09'
            if (!groups.has(dateKey)) {
              groups.set(dateKey, { date, messages: [] });
            }
            groups.get(dateKey)!.messages.push(msg);
          }

          groupMessages = Array.from(groups.values())
            .map(({ date, messages }) => ({
              dateKey: date.toISOString().split('T')[0],
              dateLabel: this.formatDateHeader(date),
              messages
            }))
            .sort((a, b) =>
              new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()
            );
        }

        const { messages, ...rest } = dialog;
        this.dialog = dialog;

        if (!this.initialScrollDone && groupMessages.length > 0) {
          setTimeout(() => {
            this.scrollToBottom();
            this.initialScrollDone = true;
          }, 100);
        }

        return {
          ...rest,
          groupMessages
        };
      }),
    );
  }

  ngAfterViewInit() {
    this.autoResize();
  }

  public navigateFeedback(orderId: string, userId: string, userType: string): void {
    if (this.dialog?.typeLead) {
      this.navCtrl.navigateForward(`/feedback/${userId}/${orderId}/${userType}/lead`);
    } else {
      this.navCtrl.navigateForward(`/feedback/${userId}/${orderId}/${userType}`);
    }
  }

  public get isCustomerDone(): boolean {
    if (this.dialog?.status === this.orderStatus.CONFIRM_EXECUTOR || this.dialog?.status === this.orderStatus.CONFIRM) {
      const isAuthor = this.dialog?.author !== this.authService.uid;
      const isDialogAccepted = this.dialog?.status === this.orderStatus.CONFIRM;
      return (
        isAuthor &&
        this.dialog?.messages?.length > 0 &&
        (this.dialog?.status !== this.orderStatus.CONFIRM_CUSTOMER || isDialogAccepted)
      );
    } else {
      return false;
    }
  }

  public get isCustomerRate(): boolean {
    const isAuthor = this.dialog?.author !== this.authService.uid;
    const isOrderRateClient = this.dialog?.isRateClient !== true;
    const isOrderRejection = this.dialog?.status === this.orderStatus.REJECTION;
    const isConfirmCustomer = this.dialog?.status === this.orderStatus.CONFIRM_CUSTOMER;
    const isCompletedCustomer = this.dialog?.status === this.orderStatus.COMPLETED;
    return (
      isAuthor &&
      this.dialog?.author &&
      this.dialog?.messages?.length > 0 &&
      (isOrderRejection || isConfirmCustomer || isCompletedCustomer) &&
      isOrderRateClient
    );
  }

  public get isInstallerDone(): boolean {
    if (this.dialog?.status === this.orderStatus.CONFIRM_CUSTOMER || this.dialog?.status === this.orderStatus.CONFIRM) {
      const isAuthor = this.dialog?.author === this.authService.uid;
      const isDialogAccepted = this.dialog?.status === this.orderStatus.CONFIRM;
      return (
        isAuthor &&
        this.dialog?.messages?.length > 0 &&
        (this.dialog?.status !== this.orderStatus.CONFIRM_EXECUTOR || isDialogAccepted)
      );
    } else {
      return false;
    }
  }

  public get isExecutorRate(): boolean {
    const isAuthor = this.dialog?.author === this.authService.uid;
    const isOrderRateClient = this.dialog?.isRateExecutor !== true;
    const isOrderRejection = this.dialog?.status === this.orderStatus.REJECTION;
    const isConfirmExecutor = this.dialog?.status === this.orderStatus.CONFIRM_EXECUTOR;
    const isCompletedExecutor = this.dialog?.status === this.orderStatus.COMPLETED;
    return (
      isAuthor &&
      this.dialog?.author &&
      this.dialog?.messages?.length > 0 &&
      (isOrderRejection || isConfirmExecutor || isCompletedExecutor) &&
      isOrderRateClient
    );
  }

  // Заказчик нажал выполнено
  public doneOrderCustomer(): void {
    this.text = 'Заказчик отметил заказ как выполненный.';
    if (this.dialog?.doneCustomer && this.dialog?.doneExecutor) {
      this.status = this.orderStatus.COMPLETED;
      this.sendMessage(true);
    } else {
      this.status = this.orderStatus.CONFIRM_CUSTOMER;
      this.sendMessage(true);
    }
    this.chatService.doneDialogCustomer(this.id, true, this.dialog?.doneExecutor).then();
  }

  public doneOrderExecutor(): void {
    this.text = 'Исполнитель отметил заказ как выполненный.';
    if (this.dialog?.doneCustomer && this.dialog?.doneExecutor) {
      this.status = this.orderStatus.COMPLETED;
      this.sendMessage(true);
    } else {
      this.status = this.orderStatus.CONFIRM_EXECUTOR;
      this.sendMessage(true);
    }
    this.chatService.doneDialogExecutor(this.id, this.dialog?.doneCustomer, true);
  }

  public sendLead(): void {
    this.core.presentAlert(
      'Внимание',
      'Вы действительно хотите отдать лид? При нажатии "Да" в чат автоматически отправится сообщение с данными заказа.',
      ['Да', 'Нет']
    ) .then((result) => {
      if (result === 'Да') {
        const cleanText = (text: string) =>
          text
            ?.replace(/\[\/?p\]/g, '')        // удаляем [p] и [/p]
            .replace(/\s+/g, ' ')            // нормализуем пробелы
            .trim()
            .replace(/;+$/, '');
        this.text = this.buildMessageHtml({
          address: this.dialog?.orderAddress,
          comment: cleanText(this.dialog?.description),
          phone: this.dialog?.phoneLead
        });
        this.chatService.updateStatusLead(this.dialogParts.orderId, this.orderStatus.CONFIRM, this.dialog.author).then();
        this.chatService.updateLeadChatDone(this.id).then();
        this.pushNewEmailService.sendPushLead(this.dialog?.name, this.dialog?.phoneLead, this.dialog?.orderAddress, cleanText(this.dialog?.description), this.user.email);
        this.sendMessage();
        this.leadService.getDealById(this.dialogParts.orderId).pipe(untilDestroyed(this)).subscribe((order: any) => {
          // Берём rejectIds из order (если есть), fallback — пустой массив
          const rejectIds = order.rejectedIds || [];
          // Исключаем текущего автора диалога + всех из rejectIds
          const excludedIds = new Set([this.dialog.author, ...rejectIds]);

          // Фильтруем written: остаются только ID, которых нет в excludedIds
          const ids = order.written?.filter(id => id && !excludedIds.has(id)) || [];
          if (ids.length > 0) {
            ids.forEach(id => {
              this.text = 'Заказчик передал лид другому исполнителю.';
              const idChat = `${this.isManager ? this.dialogParts.authorId : this.authService.uid}_${id}_${this.dialogParts.orderId}`;
              this.status = this.orderStatus.TRANSFERRED;
              this.sendMessage(true, idChat);
            });
          }
        });
        this.status = this.orderStatus.CONFIRM_EXECUTOR;
        this.text = `Отправили Вам информацию по лиду.`;
        this.sendMessage(true);
      }
    })
  }

  // Исполнитель хочет взять заказ
  public takeOrder(): void {
    this.text = `Исполнитель готов выполнить заказ.`;
    this.status = this.orderStatus.SEND_OFFER;
    this.sendMessage(true);
  }

  // Исполнитель отказывается от заказа, до его работы
  public rejectOrder(): void {
    this.text = 'Исполнитель отказался от выполнения заказа.';
    this.status = this.orderStatus.REJECTION_WITHOUT_START;
    this.chatService.rejectdOrderIds(this.dialogParts.orderId, this.dialogParts.userId).then();
    this.sendMessage();
  }

  // Отказ исполнителю до начала его работы
  public rejectContractor(): void {
    this.text = 'Заказчик отказал Вам в выполнение заказа.';
    this.status = this.orderStatus.REJECTION_WITHOUT_START;
    this.chatService.rejectdOrderIds(this.dialogParts.orderId, this.dialogParts.userId).then()
    this.sendMessage();
  }

  public rejectionExecutor(): void {
    this.text = 'Заказ отменён. Исполнитель отказался от выполнения заказа. Вы можете оставить отзыв о сотрудничестве.'
    this.status = this.orderStatus.REJECTION;
    this.chatService.updateStatusOrder(this.dialogParts.orderId, this.orderStatus.REJECTION).then();
    this.sendMessage(true);
  }

  public rejectionCustomer(): void {
    this.text = 'Заказ отменён. Заказчик отказался от выполнения заказа. Вы можете оставить отзыв о сотрудничестве.'
    this.status = this.orderStatus.REJECTION;
    this.chatService.updateDialogRefuse(this.id, {refuseCustomer: true}).then();
    this.chatService.updateStatusOrder(this.dialogParts.orderId, this.orderStatus.REJECTION).then();
    this.sendMessage(true);
  }

  // Передача заказа исполнителю и отказ всем кто писал.
  public giveOrderContractor(): void {
    this.text = 'Заказчик выбрал Вас для выполнения заказа';
    this.status = this.orderStatus.CONFIRM;
    this.sendMessage(true);
    this.chatService.updateStatusOrder(this.dialogParts.orderId, this.orderStatus.CONFIRM).then();
    this.orderService.order(this.dialogParts.orderId).pipe(take(1)).subscribe((order: any) => {
      // Берём rejectIds из order (если есть), fallback — пустой массив
      const rejectIds = order.rejectedIds || [];
      // Исключаем текущего автора диалога + всех из rejectIds
      const excludedIds = new Set([this.dialog.author, ...rejectIds]);

      // Фильтруем written: остаются только ID, которых нет в excludedIds
      const ids = order.written?.filter(id => id && !excludedIds.has(id)) || [];
      if (ids.length > 0) {
        ids.forEach(id => {
          this.text = 'Заказчик передал заказ другому исполнителю.';
          const idChat = `${this.authService.uid}_${id}_${this.dialogParts.orderId}`;
          this.status = this.orderStatus.TRANSFERRED;
          this.sendMessage(true, idChat);
        });
      }
    });
  }

  public openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  public sendMessage(isButton = false, id?: string): void {
    if (this.selectedFiles.length) {
        this.uploadFileService.saveOrderFilesToStorage(this.selectedFiles.map((x) => x.file), this.dialogParts.orderId).then((res) => {
          this.chatService.add(id ?? this.id, this.text, res, this.order, !this.dialog, this.status, this.isManager).then(() => {
          });
        })
    } else {
      this.chatService.add(id ?? this.id, this.text, [], this.order, !this.dialog, this.status, this.isManager).then(() => {
      });
    }
    if (this.user?.callNotification && !isButton) {
      // Нотификация телефон
      const userWriteLead = this.authService.uid === this.dialogParts?.userId && this.dialog?.typeLead
        || this.authService.uid === this.dialogParts?.userId && this.order?.type === 'Лид' ;
      if (userWriteLead) {
        this.chatService.getManagersRaw().then((res: any) => {
          res.forEach(user => {
            if (user.notifications?.callNotificationMessage) {
              this.sendNotification(user.id);
            }
          });
          if (this.user.notifications?.callNotificationMessage) {
            this.sendNotification(this.user?.id);
          }

        })} else {
        if (this.user.notifications?.callNotificationMessage) {
          this.sendNotification(this.user?.id);
        }
      }
    }
    this.selectedFiles = [];
    this.text = '';
    this.status = null;
    this.autoResize();
  }

  public getName(): string {
    if (this.user) {
      if (this.user.mode === this.userMode.FACTORY) {
        return this.user?.nameFactory ?? 'Имя не задано';
      } else {
        return this.user?.fio ?? 'Имя не задано';
      }
    } else {
      return '';
    }
  }

  public getTitle(): string {
    if (this.user) {
      if (this.user.mode === this.userMode.FACTORY) {
        if (this.dialog?.orderType === 'Лид' && this.dialogParts.authorId === this.authService.uid) {
          return this.user?.phone ?? 'Номер не задан'
        }
        return this.user?.nameFactory ?? 'Имя не задано';
      } else {
        if (this.dialog?.orderType === 'Лид' && (this.isManager || this.dialogParts.authorId === this.authService.uid)) {
          return this.user?.phone ?? 'Номер не задан'
        }
        return this.user?.fio ?? 'Имя не задано';
      }
    } else {
      return '';
    }
  }

  public openProfile(): void {
    if (!this.isActiveSubscribe) {
      this.core
        .presentAlert(
          `Подписка`,
          `Просмотр профиля доступен только пользователям с подпиской.`,
          ['Закрыть', 'Подробнее']
        )
        .then(btn => {
          if (btn == 'Подробнее')
            this.navCtrl.navigateForward('/tabs/map/subscription');
        })
    } else {
      this.navCtrl.navigateForward(`/profile/${this.user.id}/${this.user.role}`);
    }
  }

  public callCustomer(): void {
    if (!this.isActiveSubscribe) {
      this.core
        .presentAlert(
          `Подписка`,
          `Функция звонить доступна только пользователям с подпиской.\n
          Если Вы еще не оформили подписку,то Вы можете только писать,эта функция бесплатная.\n`,
          ['Закрыть', 'Подробнее']
        )
        .then(btn => {
          if (btn == 'Подробнее')
            this.navCtrl.navigateRoot('/tabs/map/subscription')
        })
    } else {
      this.sendCallMessage();
      window.location.href = `tel:${this.user['phone']}`;
    }
  }

  public sendCallMessage() {
    const text = `Пользователь ${this.user.fio} звонил Вам с номера ${this.phoneMaskPipe.transform(this.user.phone)} в ${moment().format('HH:mm')}`
    this.chatService.add(this.id, text, [], this.order, !this.dialog)
      .then(() => {});
  }

  public back(): void {
    this.navCtrl.back();
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    Array.from(input.files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        this.presentToast(`Недопустимый тип файла`).then();
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        this.presentToast(`Размер файла не должен превышать 5 МБ`).then();
        return;
      }

      // Проверка на дубликат по имени
      if (this.selectedFiles.some(f => f.name === file.name)) {
        this.presentToast(`Файл с таким именем уже добавлен`).then();
        return;
      }

      const isImage = file.type.startsWith('image/');
      const newFile: SelectedFile = { name: file.name, file, isImage };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          newFile.preview = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
      this.selectedFiles.push(newFile);
    });

    input.value = '';
  }


  removeFile(file: SelectedFile): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  onEnter(event: any): void {
    if (event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (this.text?.trim()) {
      this.sendMessage();
    }
  }

  public downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName; // ← именно это имя будет в окне сохранения
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public formatFileSizeRu(bytes: number, decimals: number = 1): string {
    // 🔐 Защита от некорректных входных данных
    if (!Number.isFinite(bytes) || bytes < 0) {
      return '—';
    }
    if (!Number.isInteger(decimals) || decimals < 0) {
      decimals = 1;
    }

    const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    let unitIndex = 0;
    let size = bytes;

    // Делим на 1024 (двоичные единицы — так привычнее в ОС и файловых менеджерах)
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    // Округляем до нужного числа знаков
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(size * factor) / factor;

    // Форматируем число по-русски: запятая, без лишних нулей
    const numberStr = rounded.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals > 0 && rounded % 1 !== 0 ? decimals : 0,
      maximumFractionDigits: decimals
    });

    return `${numberStr} ${units[unitIndex]}`;
  }

  public autoResize(): void {
    if (this.textarea) {
      const el = this.textarea.nativeElement;
      el.style.height = 'auto';

      const maxHeight = parseInt(getComputedStyle(el).maxHeight);
      if (el.scrollHeight > maxHeight) {
        el.style.height = `${maxHeight}px`;
        el.style.overflowY = 'auto';
      } else {
        el.style.height = `${el.scrollHeight}px`;
        el.style.overflowY = 'hidden';
      }
    }
  }

  private async presentToast(
    message: string,
    duration: number = 2000,
    color: string = 'dark',
    buttons?: { text: string; role?: string; handler?: () => void }[]
  ): Promise<HTMLIonToastElement> {
    const toast = await this.toast.create({
      message,
      duration,
      position: 'top',
      color,
      buttons: buttons || [
        {
          text: '✖',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
    return toast;
  }

  private formatDateHeader(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return 'Сегодня';
    if (isSameDay(date, yesterday)) return 'Вчера';

    // Локализованные названия месяцев (можно вынести в константы)
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];

    if (date.getFullYear() === today.getFullYear()) {
      return `${day} ${month}`;
    } else {
      return `${day} ${month} ${date.getFullYear()}`;
    }
  }

  private checkStatusFooter(dialog: any): void {
    if (dialog) {
      const dialogDate = dialog?.orderDate
        ? toMoscowDate(new Date(dialog.orderDate))
          .toISOString()
          .slice(0, 10) <
        toMoscowDate(new Date()).toISOString().slice(0, 10)
        : false;
      this.disabledFooter = dialog.status === this.orderStatus.REJECTION
        || dialog.status === this.orderStatus.COMPLETED
        || dialog.status === this.orderStatus.CONFIRM_EXECUTOR
        || dialog.status === this.orderStatus.CONFIRM_CUSTOMER
        || dialog.status === this.orderStatus.BUY
        || dialog.status === this.orderStatus.REJECTION_WITHOUT_START
        || dialog.status === this.orderStatus.TRANSFERRED
        || dialogDate;
    }
  }

  public scrollToBottom(isAnimated = false): void {
    const nativeEl = this.chatContentEl?.nativeElement;
    if (!nativeEl) return;

    let scrollElement: HTMLElement | null = null;

    // Shadow DOM (основной путь в Ionic)
    if (nativeEl.shadowRoot) {
      scrollElement = nativeEl.shadowRoot.querySelector('.inner-scroll');
    }


    // Fallback (если shadow DOM отключён или SSR)
    if (!scrollElement) {
      scrollElement = nativeEl.querySelector('.inner-scroll') || nativeEl;
    }

    if (scrollElement) {
      if (isAnimated) {
        scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
      } else {
        scrollElement.scrollTop = scrollElement.scrollHeight; // без анимации — мгновенно и стабильно
      }
    }
  }

  private buildMessageHtml({
                             address,
                             comment,
                             phone,

                           }: {
    address?: string;
    comment?: string;
    phone?: string;
  }): string {
    let html = '<div>';

    if (address) {
      html += `<p><b style="padding-right: 5px">Адрес:</b> ${address}</p>`;
    }

    if (comment) {
      html += `<p><b style="padding-right: 5px">Комментарий:</b> ${comment}</p>`;
    }

    if (phone) {
      html += `<p><b style="padding-right: 5px">Номер телефона:</b> ${phone}</p>`;
    }
    html += '</div>';

    return html;
  }

  private getUserAuthorDialog(): void {
    let author = this.dialogParts.authorId !== this.authService.uid ? this.dialogParts.authorId : this.dialogParts.userId;
    if (this.isManager) {
      author = this.dialogParts.userId;
    }
    this.authService.getUser(author).pipe(untilDestroyed(this)).subscribe((user: UserInterface) => {
      this.user = user;
      this.loader = false;
    });
  }

  private sendNotification(uid: string): void {
    const sendNotification = httpsCallable(this.functions, 'sendNotificationAll');
    from(sendNotification({
      title: `Новое сообщение`,
      body: this.dialog?.orderAddress ? `заказ «${this.dialog?.orderAddress}» \n ${this.text}` : `${this.text}`,
      uid: uid,
      link: `/tabs/dialogs/addresses`
    })).subscribe({
      next: () => console.log('Уведомление отправлено'),
      error: (err) => console.error('Ошибка отправки уведомления:', err)
    });
  }
}
