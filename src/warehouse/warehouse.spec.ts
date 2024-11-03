import { Logger } from "@nestjs/common";
import { WarehouseService } from "./warehouse";
import { SortByProperties } from "./types";

describe('Warehouse', () => {
    const logger = new Logger('Tests Warehouse');
    let warehouse: WarehouseService;

    beforeEach(() => {
        warehouse = new WarehouseService(logger);
    });

    describe('addSupplies', () => {
        it('should add supplies', () => {
            const items = [
                { when: '2021-01-01', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02', sku: 'B', qty: 20, price: 200 },
            ];
            const result = warehouse.addSupplies(items);

            expect(result).toEqual({ success: 2 });
        });

        it('should add supplies and report issues', () => {
            const items = [
                { when: '2021-01-01', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02', sku: 'B', qty: -20, price: 200 },
            ];
            const result = warehouse.addSupplies(items);

            expect(result).toEqual({ success: 1, issues: 1 });
        });

        it('should add supplies and report errors', () => {
            const items = [
                { when: '2021-01-02', sku: 'B', qty: -20, price: 200 },
                { when: '2021-01-03', sku: 'C', qty: 30, price: -300 },
            ];
            const result = warehouse.addSupplies(items);

            expect(result).toStrictEqual({
                errors: [
                    'Quantity must be positive',
                    'Price must be positive',
                ]
            });
        });
    });

    describe('getAvailableSupplies', () => {
        it('should return available supplies', () => {
            const items = [
                { when: '2021-01-01', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02', sku: 'B', qty: 20, price: 200 },
                { when: '2021-01-03', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04', sku: 'B', qty: 3, price: 180 },
            ];
            warehouse.addSupplies(items);

            const suppliesRange1 = warehouse.getAvailableSupplies({ from: '2021-01-01T00:00:00', to: '2021-01-02T23:59:59' });
            const suppliesRange2 = warehouse.getAvailableSupplies({ from: '2021-01-03T00:00:00', to: '2021-01-04T23:59:59' });
            const suppliesRange3 = warehouse.getAvailableSupplies({ from: '2020-01-01', to: '2025-01-01' });
            const suppliesRange4 = warehouse.getAvailableSupplies({ from: '2025-01-01', to: '2030-01-01' });

            expect(suppliesRange1).toStrictEqual([
                { sku: 'A', qty: 10, cost: 100 },
                { sku: 'B', qty: 20, cost: 200 },
            ]);
            expect(suppliesRange2).toStrictEqual([
                { sku: 'A', qty: 1, cost: 105 },
                { sku: 'B', qty: 3, cost: 180 },
            ]);
            expect(suppliesRange3).toStrictEqual([
                { sku: 'A', qty: 10, cost: 100 },
                { sku: 'B', qty: 20, cost: 200 },
                { sku: 'A', qty: 1, cost: 105 },
                { sku: 'B', qty: 3, cost: 180 },
            ]);
            expect(suppliesRange4).toStrictEqual([]);
        });

        it('should return available supplies in full format', () => {
            const items = [
                { when: '2021-01-01', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02', sku: 'B', qty: 20, price: 200 },
                { when: '2021-01-03', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04', sku: 'B', qty: 3, price: 180 },
            ];
            warehouse.addSupplies(items);

            const suppliesRange1 = warehouse.getAvailableSupplies({ from: '2021-01-01T00:00:00', to: '2021-01-02T23:59:59', isFullFormat: true });
            const suppliesRange2 = warehouse.getAvailableSupplies({ from: '2021-01-03T00:00:00', to: '2021-01-04T23:59:59', isFullFormat: true });
            const suppliesRange3 = warehouse.getAvailableSupplies({ from: '2020-01-01', to: '2025-01-01', isFullFormat: true });

            expect(suppliesRange1).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ when: '2021-01-01', sku: 'A', qty: 10, price: 100 }),
                    expect.objectContaining({ when: '2021-01-02', sku: 'B', qty: 20, price: 200 }),
                ])
            );
            expect(suppliesRange2).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ when: '2021-01-03', sku: 'A', qty: 1, price: 105 }),
                    expect.objectContaining({ when: '2021-01-04', sku: 'B', qty: 3, price: 180 }),
                ])
            );
            expect(suppliesRange3).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ when: '2021-01-01', sku: 'A', qty: 10, price: 100 }),
                    expect.objectContaining({ when: '2021-01-02', sku: 'B', qty: 20, price: 200 }),
                    expect.objectContaining({ when: '2021-01-03', sku: 'A', qty: 1, price: 105 }),
                    expect.objectContaining({ when: '2021-01-04', sku: 'B', qty: 3, price: 180 }),
                ])
            );
        });

        it('should return available supplies by given sku', () => {
            const items = [
                { when: '2021-01-01', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02', sku: 'B', qty: 20, price: 200 },
                { when: '2021-01-03', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04', sku: 'B', qty: 3, price: 180 },
            ];
            warehouse.addSupplies(items);

            const suppliesRange1 = warehouse.getAvailableSupplies({ from: '2021-01-01T00:00:00', to: '2021-01-02T23:59:59', sku: 'A' });
            const suppliesRange2 = warehouse.getAvailableSupplies({ from: '2021-01-03T00:00:00', to: '2021-01-04T23:59:59', sku: 'B' });
            const suppliesRange3 = warehouse.getAvailableSupplies({ from: '2020-01-01', to: '2025-01-01', sku: 'A' });

            expect(suppliesRange1).toStrictEqual([
                { sku: 'A', qty: 10, cost: 100 },
            ]);
            expect(suppliesRange2).toStrictEqual([
                { sku: 'B', qty: 3, cost: 180 },
            ]);
            expect(suppliesRange3).toStrictEqual([
                { sku: 'A', qty: 10, cost: 100 },
                { sku: 'A', qty: 1, cost: 105 },
            ]);
        });

        it('should return available supplies to given date only', () => {
            const items = [
                { when: '2021-01-01', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02', sku: 'B', qty: 20, price: 200 },
                { when: '2021-01-03', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04', sku: 'B', qty: 3, price: 180 },
            ];
            warehouse.addSupplies(items);

            const suppliesRange1 = warehouse.getAvailableSupplies({ to: '2021-01-02T23:59:59', sku: 'A' });
            const suppliesRange2 = warehouse.getAvailableSupplies({ to: '2021-01-04T23:59:59', sku: 'B' });
            const suppliesRange3 = warehouse.getAvailableSupplies({ to: '2025-01-01', sku: 'A' });

            expect(suppliesRange1).toStrictEqual([
                { sku: 'A', qty: 10, cost: 100 },
            ]);
            expect(suppliesRange2).toStrictEqual([
                { sku: 'B', qty: 20, cost: 200 },
                { sku: 'B', qty: 3, cost: 180 },
            ]);
            expect(suppliesRange3).toStrictEqual([
                { sku: 'A', qty: 10, cost: 100 },
                { sku: 'A', qty: 1, cost: 105 },
            ]);
        });
    });

    describe('addSale', () => {
        it ('should add sale, ideal case all supplies available in one', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });
            const issues = warehouse.getIssues({});
            expect(issues).toStrictEqual([]);
            const salesState = warehouse['sales'];
            const suppliesState = warehouse['supplies'];
            expect(salesState).toStrictEqual(expect.arrayContaining([
                expect.objectContaining({ when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150, sum: 750, profit: 250, margin: 33.33, }),
                expect.objectContaining({ when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250, sum: 2500, profit: 500, margin: 20 }),
                expect.objectContaining({ when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105, sum: 105, profit: 5, margin: 4.76 }),
                expect.objectContaining({ when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180, sum: 540, profit: -60, margin: -11.11 }),
            ]));
            expect(suppliesState).toStrictEqual(expect.arrayContaining([
                expect.objectContaining({ when: '2021-01-01T00:00:00', sku: 'A', qty: 4, price: 100 }),
                expect.objectContaining({ when: '2021-01-02T00:00:00', sku: 'B', qty: 7, price: 200 }),
            ]));
        });

        it ('should add sale, ideal case multipy supplies', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 3, price: 120 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 11, price: 220 },
                { when: '2021-01-03T00:00:00', sku: 'A', qty: 3, price: 100 },
                { when: '2021-01-04T00:00:00', sku: 'B', qty: 4, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-03T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 4 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });
            const salesState = warehouse['sales'];
            const suppliesState = warehouse['supplies'];
            expect(salesState).toStrictEqual(expect.arrayContaining([
                expect.objectContaining({ when: '2021-01-03T12:34:56', sku: 'A', qty: 5, price: 150, sum: 750, profit: 190, margin: 25.33, }),
                expect.objectContaining({ when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105, sum: 105, profit: 5, margin: 4.76 }),
                expect.objectContaining({ when: '2021-01-04T08:22:33', sku: 'B', qty: 10, price: 250, sum: 2500, profit: 300, margin: 12 }),
                expect.objectContaining({ when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180, sum: 540, profit: -80, margin: -14.81 }),
            ]));
            expect(suppliesState).toStrictEqual(expect.arrayContaining([
                expect.objectContaining({ when: '2021-01-04T00:00:00', sku: 'B', qty: 2, price: 200 }),
            ]));
        });

        it ('should add sale, some items out of stock for the given date', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 3, price: 120 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 11, price: 220 },
                { when: '2021-01-03T00:00:00', sku: 'A', qty: 3, price: 100 },
                { when: '2021-01-04T00:00:00', sku: 'B', qty: 4, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 }, // it's out of stock for the given date, only 3 items available
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 4 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 3, issues: 1 });
            const salesState = warehouse['sales'];
            const suppliesState = warehouse['supplies'];
            const issues = warehouse.getIssues({});
            expect(issues).toStrictEqual([
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150, message: 'A is out of stock' },
            ]);
            expect(salesState.length).toBe(3);
            expect(salesState).toStrictEqual(expect.arrayContaining([
                expect.objectContaining({ when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105, sum: 105, profit: -15, margin: -14.29 }),
                expect.objectContaining({ when: '2021-01-04T08:22:33', sku: 'B', qty: 10, price: 250, sum: 2500, profit: 300, margin: 12 }),
                expect.objectContaining({ when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180, sum: 540, profit: -80, margin: -14.81 }),
            ]));
            expect(suppliesState.length).toBe(3);
            expect(suppliesState).toStrictEqual(expect.arrayContaining([
                expect.objectContaining({ when: '2021-01-01T00:00:00', sku: 'A', qty: 2, price: 120 }),
                expect.objectContaining({ when: '2021-01-03T00:00:00', sku: 'A', qty: 3, price: 100 }),
                expect.objectContaining({ when: '2021-01-04T00:00:00', sku: 'B', qty: 2, price: 200 }),
            ]));
        });
    });

    describe('getProfit', () => {
        it('should return profit information group by sku', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });
            const profit = warehouse.getProfit({ from: '2021-01-01T00:00:00', to: '2021-01-04T23:59:59' });
            expect(profit.length).toBe(2);
            expect(profit).toStrictEqual([
                { sku: 'A', profit: 255, sum: 855, margin: 29.82, qty: 6 },
                { sku: 'B', profit: 440, sum: 3040, margin: 14.47, qty: 13 },
            ]);
        });
    });

    describe('getTopSales', () => {
        it('should return top sales by profit between date', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });
            const profit = warehouse.getTopSales({ from: '2021-01-01T00:00:00', to: '2021-01-04T23:59:59', limit: 10, sortBy: SortByProperties.profit });
            expect(profit.length).toBe(4);
            expect(profit).toStrictEqual([
                { sku: 'B', profit: 500, sum: 2500, margin: 20, qty: 10 },
                { sku: 'A', profit: 250, sum: 750, margin: 33.33, qty: 5 },
                { sku: 'A', profit: 5, sum: 105, margin: 4.76, qty: 1 },
                { sku: 'B', profit: -60, sum: 540, margin: -11.11, qty: 3 },
            ]);
        });

        it('should return top two sales by profit between date (test limit)', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });

            const profit = warehouse.getTopSales({ from: '2021-01-01T00:00:00', to: '2021-01-04T23:59:59', limit: 2, sortBy: SortByProperties.profit });
            expect(profit.length).toBe(2);
            expect(profit).toStrictEqual([
                { sku: 'B', profit: 500, sum: 2500, margin: 20, qty: 10 },
                { sku: 'A', profit: 250, sum: 750, margin: 33.33, qty: 5 },
            ]);
        });

        it('should return top two sales by profit between date (test range)', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });

            const profit = warehouse.getTopSales({ from: '2021-01-03T00:00:00', to: '2021-01-04T23:59:59', limit: 10, sortBy: SortByProperties.profit });
            expect(profit.length).toBe(2);
            expect(profit).toStrictEqual([
                { sku: 'A', profit: 5, sum: 105, margin: 4.76, qty: 1 },
                { sku: 'B', profit: -60, sum: 540, margin: -11.11, qty: 3 },
            ]);
        });

        it('should return top sales by margin between date', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });
            const profit = warehouse.getTopSales({ from: '2021-01-01T00:00:00', to: '2021-01-04T23:59:59', limit: 10, sortBy: SortByProperties.margin });
            expect(profit.length).toBe(4);
            expect(profit).toStrictEqual([
                { sku: 'A', profit: 250, sum: 750, margin: 33.33, qty: 5 },
                { sku: 'B', profit: 500, sum: 2500, margin: 20, qty: 10 },
                { sku: 'A', profit: 5, sum: 105, margin: 4.76, qty: 1 },
                { sku: 'B', profit: -60, sum: 540, margin: -11.11, qty: 3 },
            ]);
        });

        it('should return top sales by qty between date', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });
            const profit = warehouse.getTopSales({ from: '2021-01-01T00:00:00', to: '2021-01-04T23:59:59', limit: 10, sortBy: SortByProperties.qty });
            expect(profit.length).toBe(4);
            expect(profit).toStrictEqual([
                { sku: 'B', profit: 500, sum: 2500, margin: 20, qty: 10 },
                { sku: 'A', profit: 250, sum: 750, margin: 33.33, qty: 5 },
                { sku: 'B', profit: -60, sum: 540, margin: -11.11, qty: 3 },
                { sku: 'A', profit: 5, sum: 105, margin: 4.76, qty: 1 },
            ]);
        });

        it('should return top sales by sum between date', () => {
            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 10, price: 100 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 20, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 },
                { when: '2021-01-02T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 2 });
            const result = warehouse.addSales(salesToAdd);
            expect(result).toStrictEqual({ success: 4 });
            const profit = warehouse.getTopSales({ from: '2021-01-01T00:00:00', to: '2021-01-04T23:59:59', limit: 10, sortBy: SortByProperties.sum });
            expect(profit.length).toBe(4);
            expect(profit).toStrictEqual([
                { sku: 'B', profit: 500, sum: 2500, margin: 20, qty: 10 },
                { sku: 'A', profit: 250, sum: 750, margin: 33.33, qty: 5 },
                { sku: 'B', profit: -60, sum: 540, margin: -11.11, qty: 3 },
                { sku: 'A', profit: 5, sum: 105, margin: 4.76, qty: 1 },
            ]);
        });
    });

    describe('isFailedResult', () => {
        it('should return false if result is failed', () => {
            const result = warehouse.isFailedResult({ success: 1 });
            expect(result).toBe(false);
        });
        it('should return true if result is failed', () => {
            const result = warehouse.isFailedResult({ errors: [] });
            expect(result).toBe(true);
        });
    });

    describe('deleteAll', () => {
        it('should return success deleteAll result', () => {
            const result = warehouse.deleteAll();
            expect(result).toStrictEqual({ success: 0 });
        });

        it('should return success deleteAll result', () => {

            const suppliesToAdd = [
                { when: '2021-01-01T00:00:00', sku: 'A', qty: 3, price: 120 },
                { when: '2021-01-02T00:00:00', sku: 'B', qty: 11, price: 220 },
                { when: '2021-01-03T00:00:00', sku: 'A', qty: 3, price: 100 },
                { when: '2021-01-04T00:00:00', sku: 'B', qty: 4, price: 200 },
            ];
            const salesToAdd = [
                { when: '2021-01-01T12:34:56', sku: 'A', qty: 5, price: 150 }, // it's out of stock for the given date, only 3 items available
                { when: '2021-01-03T14:45:12', sku: 'A', qty: 1, price: 105 },
                { when: '2021-01-04T08:22:33', sku: 'B', qty: 10, price: 250 },
                { when: '2021-01-04T09:15:47', sku: 'B', qty: 3, price: 180 },
            ];
            const addResult = warehouse.addSupplies(suppliesToAdd);
            expect(addResult).toStrictEqual({ success: 4 });
            const addSalesResult = warehouse.addSales(salesToAdd);
            expect(addSalesResult).toStrictEqual({ success: 3, issues: 1 });

            const result = warehouse.deleteAll();
            expect(result).toStrictEqual({ success: 6 });
        });
    });
});