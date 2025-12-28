import { OrderTypeEnum } from '../enums/order-type.enum';
import { UsersModeEnum } from '../enums/users-mode.enum';
import { FileInterface } from './file.interface';

export interface OrderRequestInterface {
  orderDate?: string;
  price?: string;
  type?: OrderTypeEnum;
  uri?: string;
  payType?: string;
  address?: string;
  mode?: UsersModeEnum;
  role?: string;
  region?: number;
  photo?: string[];
  files?: FileInterface[];
  description?: string;
  phone?: string;
}
