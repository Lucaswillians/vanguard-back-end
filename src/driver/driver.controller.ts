import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/CreateDriver.dto';
import { UpdateDriverDto } from './dto/UpdateDriver.dto';
import { GetDriverDto } from './dto/GetDriver.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@UseGuards(AuthGuard)
@Controller('/driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) { }

  private formatResponse(driver: any, message: string) {
    return { driver, message };
  }

  @Post()
  async postDriver(
    @Body() dto: CreateDriverDto,
    @Req() req: Request,
  ): Promise<{ driver: GetDriverDto; message: string }> {
    const userId = req['user'].sub;
    const driver = await this.driverService.createDriver(dto, userId);
    return this.formatResponse(driver, 'Driver created with success!');
  }

  @Get()
  async getDrivers(@Req() req: Request): Promise<GetDriverDto[]> {
    const userId = req['user'].sub;
    return this.driverService.getDrivers(userId);
  }

  @Put('/:id')
  async updateDriver(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @Req() req: Request,
  ): Promise<{ driver: GetDriverDto; message: string }> {
    const userId = req['user'].sub;
    const driver = await this.driverService.updateDriver(id, dto, userId);
    return this.formatResponse(driver, 'Driver updated with success!');
  }

  @Delete('/:id')
  async deleteDriver(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ driver: GetDriverDto; message: string }> {
    const userId = req['user'].sub;
    const driver = await this.driverService.deleteDriver(id, userId);
    return this.formatResponse(driver, 'Driver deleted with success!');
  }

  @Get(':id/remuneration')
  async getDriverRemuneration(
    @Param('id') id: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.driverService.getDriverMonthlyRemuneration(id, month, year, userId);
  }
}
