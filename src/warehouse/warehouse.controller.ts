import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { WarehouseService } from './warehouse';
import { FailedResult, SuccessResult, SkuItemDto, SaleItemWithProfit, Issue, SortByProperties } from './types';

@Controller('api')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  /* 1. POST /api/supply
  */
  @Post('supply')
  async addSupplies(@Body() supplies: { data: SkuItemDto[] }, @Res() response: Response): Promise<{ data: SuccessResult | FailedResult}> {
    if (!supplies.data?.length) {
      response.status(422).send({ errors: ['Data should be an array of objects'] });
      return;
    }
    const result = this.warehouseService.addSupplies(supplies.data);
    if (this.warehouseService.isFailedResult(result)) {
      response.status(422).send(result);
      return;
    }
    response.status(201).send({ data: result });
    return;
  }

  /* 2. POST /api/sales
  */
  @Post('sales')
  async addSales(@Body() sales: { data: SkuItemDto[] }, @Res() response: Response): Promise<{ data: SuccessResult | FailedResult}> {
    if (!sales.data?.length) {
      response.status(422).send({ errors: ['Data should be an array of objects'] });
      return;
    }
    const result = this.warehouseService.addSales(sales.data);
    if (this.warehouseService.isFailedResult(result)) {
      response.status(422).send(result);
      return;
    }
    response.status(201).send({ data: result });
    return;
  }

  /* 3. GET /api/profit?from{{from}}&to={{to}}
  */
  @Get('profit')
  async getProfit(@Query('from') from: string, @Query('to') to: string, @Res() response: Response): Promise<{ data: SaleItemWithProfit[] }> {
    try {
      const result = this.warehouseService.getProfit({ from, to });
      response.status(200).send({ data: result });
      return;
    } catch (e) {
      response.status(422).send({ errors: [e.message] });
      return;
    }
  }

  /* 4. GET /api/availability?from{{from}}&to={{to}}
  */
  @Get('availability')
  async getAvailability(@Query('from') from: string, @Query('to') to: string, @Res() response: Response): Promise<{ data: SaleItemWithProfit[] }> {
    try {
      const result = this.warehouseService.getAvailableSupplies({ from, to });
      response.status(200).send({ data: result });
      return;
    } catch (e) {
      response.status(422).send({ errors: [e.message] });
      return;
    }
  }

  /* 5. GET /api/issues?from{{from}}&to={{to}}
  */
  @Get('issues')
  async getIssues(@Query('from') from: string, @Query('to') to: string, @Res() response: Response): Promise<{ data: Issue[] }> {
    try {
      const result = this.warehouseService.getIssues({ from, to });
      response.status(200).send({ data: result });
    } catch (e) {
      response.status(422).send({ errors: [e.message] });
      return;
    }
  }

  /* 6. GET /api/top?from{{from}}&to={{to}}&top=100&by=profit
  */
  @Get('top')
  async getTop(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('top') top: number,
    @Query('by') by: SortByProperties,
    @Res() response: Response,
  ): Promise<{ data: SaleItemWithProfit[] }> {
    const validatedTopNumber = Number(top);
    if (isNaN(validatedTopNumber)) {
      response.status(422).send({ errors: ['Top should be a number'] });
    }
    if (validatedTopNumber < 1) {
      response.status(422).send({ errors: ['Top should be greater than 0'] });
    }

    try {
      const sortBy = this.warehouseService.stringToSortByProperties(by);
      const result = this.warehouseService.getTopSales({ from, to, limit: top, sortBy });
      response.status(200).send({ data: result });
    } catch (e) {
      response.status(422).send({ errors: [e.message] });
      return;
    }
  }

  /* 7. DELETE /api/flush - delete all records
  */
  @Delete('flush')
  async delete(@Res() response: Response): Promise<{ data: SuccessResult }> {
    try {
      const result = this.warehouseService.deleteAll();
      response.status(204).send({ data: result });
      return;
    } catch (e) {
      response.status(422).send({ errors: [e.message] });
    }
  }
}
