import { Logger } from "@nestjs/common";
import { WarehouseService } from "./warehouse";
import { WarehouseController } from "./warehouse.controller";

// !!!! CONTROLLER TESTS are E2E tests located IN root tests/app.e2e-spec.ts!!!!!
describe('Warehouse', () => {
    const logger = new Logger('Tests Warehouse Controller');
    let warehouse: WarehouseService;
    let warehouseController: WarehouseController;

    beforeEach(() => {
        warehouse = new WarehouseService(logger);
        warehouseController = new WarehouseController(warehouse);
    });

    it('should be defined', () => {
        expect(warehouseController).toBeDefined();
    });
});
// !!!! CONTROLLER TESTS are E2E tests located IN root tests/app.e2e-spec.ts!!!!!