import { Request } from "express";

export interface ITopupRequest extends Request {
  user_id: string;
  amount: number;
}

export interface IPayDataset extends ITopupRequest {}

export interface IUserBalance {
  user_id: string;
  balance: number;
}

export interface ILabelEntry extends Request {
  pay_by: string;
  to_whom: string;
  amount: number;
}
