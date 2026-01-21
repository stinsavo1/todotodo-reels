import { UsersModeEnum } from '../enums/users-mode.enum';

export interface UserInterface {
  address: string;
  call: boolean;
  callNotification: boolean;
  emailNotification: boolean;
  description: string;
  email: string;
  fio: string;
  geometry: number[];
  id: string;
  lastInactiveTime: string;
  message: boolean;
  mode: UsersModeEnum;
  finishPeriod: string;
  phone: string;
  photo: string[];
  // Рейтинги у старых осталось
  ratingJobLike: number;
  ratingOrders: number;
  ratingRecommendations: number;
  ratingRecommendationsExecutor: number;
  ratingClaimExecutor: number;
  ratingClaim: number;

  region: number;
  role: string;
  commentAdmin?: string;
  createDate?: number;
  shortName?: string;
  partnership?: boolean;
  cashback: number;
  nameFactory: string;
  subscribtionsIds:string[]; //на кого подписан юзер
  subscribtionsCount:number;
  subscribersIds:string[];//кто на него подписан
  subscribersCount?:number;
}

export interface Subscription{
  id:string;
  name:string
}

export interface UserWithRegion extends UserInterface{
  nameRegion:string;
}

export type UserById = Record<string, UserWithRegion>;
