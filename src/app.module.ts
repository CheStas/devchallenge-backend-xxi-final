import { Logger, Module } from '@nestjs/common';
import { WarehouseController } from './warehouse/warehouse.controller';
import { WarehouseService } from './warehouse/warehouse';

@Module({
  imports: [
  ],
  controllers: [WarehouseController],
  providers: [
    {
      provide: Logger,
      useValue: new Logger('AppCallModule'),
    },
    WarehouseService,
  ],
})
export class AppModule {}
