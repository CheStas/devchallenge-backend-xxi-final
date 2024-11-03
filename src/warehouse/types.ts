import { DateTime } from "luxon";

type SkuItemBase = {
    when: string;
    sku: string;
    qty: number;
    price: number;
}

export type SkuItemDto = SkuItemBase;

export type SupplyItem = SkuItemBase & {
    date?: DateTime;
    id?: string;
}
export type AvailableSupplyItem = Pick<SkuItemBase, 'sku' | 'qty'> & { cost: number };

export type SaleItem = SkuItemBase & {
    date?: DateTime;
    profit?: number;
    sum?: number;
    margin?: number;
}

export type SaleItemWithProfit = Pick<SaleItem, 'sku' | 'qty' | 'sum' | 'profit' | 'margin'>;

export type Issue = SkuItemBase & { message: string };

export type SuccessResult = {
    success: number;
    issues?: number;
}

export type FailedResult = {
    errors: string[];
}

export enum SortByProperties {
    profit = 'profit', // top items by profit
    margin = 'margin', // top items by margin
    qty = 'qty', // top items by sold qty
    sum  = 'sum', // top items by sold sum
}