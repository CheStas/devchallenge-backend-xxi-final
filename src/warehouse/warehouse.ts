import { Injectable, Logger } from "@nestjs/common";
import { DateTime, Interval } from "luxon";
import { v4 as uuidv4 } from 'uuid';
import { AvailableSupplyItem, FailedResult, Issue, SaleItem, SaleItemWithProfit, SuccessResult, SupplyItem, SortByProperties } from "./types";

const DEFAULT_TIMEZONE = 'utc';
const LOWEST_DATE = '1970-01-01';
const ERROR_MESSAGES = {
    OUT_OF_STOCK: 'is out of stock',
}

@Injectable()
export class WarehouseService {
    private supplies: SupplyItem[] = [];
    private sales: SaleItem[] = [];
    private issues: Issue[] = [];

    constructor(
        private readonly logger: Logger,
    ) {}

    isFailedResult(result: SuccessResult | FailedResult): result is FailedResult {
        return (result as FailedResult).errors !== undefined
    }

    stringToSortByProperties(sortBy: string): SortByProperties {
        switch(sortBy) {
            case 'profit':
                return SortByProperties.profit;
            case 'margin':
                return SortByProperties.margin;
            case 'qty':
                return SortByProperties.qty;
            case 'sum':
                return SortByProperties.sum;
            default:
                throw new Error('Invalid by property');
        }
    }

    deleteAll(): SuccessResult {
        // success should equal number of sales + not sold supplies ?
        const success = this.sales.length + this.supplies.length;
        this.supplies = [];
        this.sales = [];
        this.issues = [];

        return { success };
    }

    addSupplies(items: SupplyItem[]): SuccessResult | FailedResult {
        let success = 0;
        let failed = 0;
        let currentIssues: Issue[] = [];

        for (let item of items) {
            try {
                // TODO sort by date
                this.addSupply(item);
                success++;
            } catch (error) {
                this.logger.warn(error.message);
                currentIssues.push({
                    when: item.when,
                    sku: item.sku,
                    qty: item.qty,
                    price: item.price,
                    message: error.message,
                });
                failed++;
            }
        }

        this.issues.push(...currentIssues);

        if (!success) {
            this.logger.warn('No supplies were added');
            return { errors: currentIssues.map(el => el.message )};
        }

        return {
            success,
            ...(failed > 0 ? { issues: failed } : {}),
        }
    }

    addSales(items: SaleItem[]): SuccessResult | FailedResult {
        let success = 0;
        let failed = 0;
        let currentIssues: Issue[] = [];

        for (let item of items) {
            try {
                this.addSale(item);
                success++;
            } catch (error) {
                this.logger.warn(error.message);
                currentIssues.push({
                    when: item.when,
                    sku: item.sku,
                    qty: item.qty,
                    price: item.price,
                    message: error.message,
                });
                failed++;
            }
        }

        this.issues.push(...currentIssues);

        if (!success) {
            this.logger.warn('No sales were added');
            return { errors: currentIssues.map(el => el.message )};
        }

        return {
            success,
            ...(failed > 0 ? { issues: failed } : {}),
        } 
    }

    getProfit({ from, to }: { from: string, to: string }): Array<SaleItemWithProfit> {
        const startDate = this.isoStringToDateTime(from);
        const endDate = this.isoStringToDateTime(to);

        if (!startDate.isValid || !endDate.isValid) {
            throw new Error('Invalid date range');
        }

        const interval = Interval.fromDateTimes(startDate, endDate);

        if (!interval.isValid) {
            throw new Error(`Invalid date range ${interval.invalidReason}`);
        }

        const selectedSales = new Map<string, SaleItemWithProfit>();

        for (let sale of this.sales) {
            if (interval.contains(sale.date)) {
                const currentSale = selectedSales.get(sale.sku);
                if (currentSale) {
                    currentSale.qty += sale.qty;
                    currentSale.sum += sale.sum;
                    currentSale.profit += sale.profit;
                    currentSale.margin = this.roundTo(currentSale.profit / currentSale.sum * 100, 2);
                    selectedSales.set(sale.sku, currentSale);
                } else {
                    selectedSales.set(sale.sku, {
                        sku: sale.sku,
                        qty: sale.qty,
                        sum: sale.sum,
                        profit: sale.profit,
                        margin: sale.margin,
                    });
                }
            }
        }

        return Array.from(selectedSales.values());
    }

    getSales({ from, to }: { from: string, to: string }): SaleItem[] {
        const startDate = this.isoStringToDateTime(from);
        const endDate = this.isoStringToDateTime(to);

        if (!startDate.isValid || !endDate.isValid) {
            throw new Error('Invalid date range');
        }

        const interval = Interval.fromDateTimes(startDate, endDate);

        if (!interval.isValid) {
            throw new Error(`Invalid date range ${interval.invalidReason}`);
        }

        return this.sales.filter(sale => interval.contains(sale.date));
    };

    getTopSales({ from, to, limit, sortBy }: { from: string, to: string, limit: number, sortBy: SortByProperties }): Array<SaleItemWithProfit> {
        const sales = this.getSales({ from, to });

        if (!sales.length) {
            return [];
        }

        const sortedSales = sales.sort((a, b) => {
            switch (sortBy) {
                case SortByProperties.profit:
                    return b.profit - a.profit;
                case SortByProperties.margin:
                    return b.margin - a.margin;
                case SortByProperties.qty:
                    return b.qty - a.qty;
                case SortByProperties.sum:
                    return b.sum - a.sum;
                default:
                    return 0;
            }
        });
        
        return (sortedSales.length > limit ? sortedSales.slice(0, limit) : sortedSales).map(sale => ({
            sku: sale.sku,
            qty: sale.qty,
            sum: sale.sum,
            profit: sale.profit,
            margin: sale.margin,
        }));
    }

    getAvailableSupplies({ from, to, sku, isFullFormat = false }: {from?: string, to: string, sku?: string, isFullFormat?: boolean}): Array<AvailableSupplyItem | SupplyItem> {
        // TODO make sure the order FIFO
        const startDate = this.isoStringToDateTime(from || LOWEST_DATE);
        const endDate = this.isoStringToDateTime(to);

        if (!startDate.isValid || !endDate.isValid) {
            throw new Error('Invalid date range');
        }

        const interval = Interval.fromDateTimes(startDate, endDate);

        if (!interval.isValid) {
            throw new Error(`Invalid date range ${interval.invalidReason}`);
        }

        const suppliesInRange = this.supplies.filter(supply => {
            if (sku && supply.sku !== sku) {
                return false;
            }
            return interval.contains(supply.date)
        });

        if (isFullFormat || !suppliesInRange.length) {
            return suppliesInRange;
        }

        return suppliesInRange.map(supply => ({
            sku: supply.sku,
            qty: supply.qty,
            cost: supply.price,
        }));
    }

    getIssues({ from, to }: { from?: string, to?: string }): Issue[] {
        if (!from && !to) {
            return this.issues;
        }

        const startDate = this.isoStringToDateTime(from || LOWEST_DATE);
        const endDate = this.isoStringToDateTime(to);

        if (!startDate.isValid || !endDate.isValid) {
            throw new Error('Invalid date range');
        }

        const interval = Interval.fromDateTimes(startDate, endDate);

        if (!interval.isValid) {
            throw new Error(`Invalid date range ${interval.invalidReason}`);
        }

        return this.issues.filter(issue => interval.contains(this.isoStringToDateTime(issue.when)));
    }

    private isoStringToDateTime(isoString: string): DateTime {
        const date = DateTime.fromISO(isoString, { zone: DEFAULT_TIMEZONE });
        return date;
    }

    private addSupply(item: SupplyItem) {
        const supply = this.validateItem(item);
        this.supplies.push(supply);
    }

    private addSale(item: SaleItem) { 
        const sale = this.validateItem<SaleItem>(item);
        const availableForSkuSupplies: SupplyItem[] = this.getAvailableSupplies({ to: item.when, sku: sale.sku, isFullFormat: true }) as SupplyItem[];
        // 1. check availability qty >= sales qty
        if (!availableForSkuSupplies.length) {
            throw new Error(`${sale.sku} ${ERROR_MESSAGES.OUT_OF_STOCK}`);
        }

        let suppliesToSell = sale.qty;
        let totalCost = 0;
        const suppliesToRemove: string[] = [];
        const suppliesToUpdate: { id: string, qty: number }[] = [];

        for (let supply of availableForSkuSupplies) {
            if (suppliesToSell <= 0) break;
            // sell all available qty if we have less than needed
            // or sell all needed qty if we have more than needed
            const qtyToSell = Math.min(suppliesToSell, supply.qty);
            // calculate total cost for the current supply price
            totalCost += qtyToSell * supply.price;
            // update suppliesToSell with the remaining qty
            suppliesToSell -= qtyToSell;
            // update supply qty
            // do not update it here, but only after we sold all needed qty
            const supplyQtyAfterSell = supply.qty - qtyToSell;
            if (supplyQtyAfterSell === 0) {
                // remove the supply from this.supplies if we sold all qty
                suppliesToRemove.push(supply.id);
            } else {
                // update the supply qty if we sold part of it
                suppliesToUpdate.push({ id: supply.id, qty: supplyQtyAfterSell });
            }
        }

        if (suppliesToSell > 0) {
            throw new Error(`${sale.sku} ${ERROR_MESSAGES.OUT_OF_STOCK}`);
        }

        // 2. calculate profit
        sale.profit = sale.price * sale.qty - totalCost;
        // 3. calculate sum
        sale.sum = sale.price * sale.qty;
        // 4. calculate margin
        sale.margin = this.roundTo(sale.profit / sale.sum * 100, 2);
        // 5. mark supply as sold, update qty, remove if qty = 0
        this.supplies = this.supplies.filter(supply => !suppliesToRemove.includes(supply.id));
        for (let supply of this.supplies) {
            for (let update of suppliesToUpdate) {
                if (supply.id === update.id) {
                    supply.qty = update.qty;
                }
            }
        }
        // 6. add sale
        this.sales.push(sale);
    }

    private roundTo(num: number, precision: number): number {
        const factor = Math.pow(10, precision)
        return Math.round(num * factor) / factor
    }

    private validateItem<T extends SupplyItem | SaleItem>(item: T): T {
        if (!item.sku) {
            throw new Error('SKU is required');
        }

        if (typeof item.sku !== 'string') {
            throw new Error('SKU must be a string');
        }

        const date = this.isoStringToDateTime(item.when);

        if (!date.isValid) {
            throw new Error('Date is required');
        }

        if (typeof item.qty !== 'number') {
            throw new Error('Quantity must be a number');
        }

        if (typeof item.price !== 'number') {
            throw new Error('Price must be a number');
        }

        if (item.price < 0) {
            throw new Error('Price must be positive');
        }

        if (item.qty < 0) {
            throw new Error('Quantity must be positive');
        }

        const uuid = uuidv4();

        return {
            ...item,
            date,
            id: uuid,
        }
    }
}