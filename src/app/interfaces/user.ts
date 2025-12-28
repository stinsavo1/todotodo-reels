export interface User {
  address: string;
  createDate: UserDate,
  call?: boolean;
  description: string;
  email: string;
  fio: string;
  shortName?: string;
  phone: string;
  id: string;
  lastInactiveTime: string;
  photo: string;
  mode?: string;
}

export interface UserDate {
  nanoseconds: number;
  seconds: number;
}
