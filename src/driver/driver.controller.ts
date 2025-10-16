import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/CreateDriver.dto';
import { UpdateDriverDto } from './dto/UpdateDriver.dto';
import { GetDriverDto } from './dto/GetDriver.dto';

@Controller('/driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) { }

  private formatResponse(driver: any, message: string) {
    return { driver, message };
  }

  @Post()
  async postDriver(@Body() dto: CreateDriverDto): Promise<{ driver: GetDriverDto; message: string }> {
    const driver = await this.driverService.createDriver(dto);
    return this.formatResponse(driver, 'Driver created with success!');
  }

  @Get()
  async getDrivers(): Promise<GetDriverDto[]> {
    return this.driverService.getDrivers();
  }

  @Put('/:id')
  async updateDriver(@Param('id') id: string, @Body() dto: UpdateDriverDto): Promise<{ driver: GetDriverDto; message: string }> {
    const driver = await this.driverService.updateDriver(id, dto);
    return this.formatResponse(driver, 'Driver updated with success!');
  }

  @Delete('/:id')
  async deleteDriver(@Param('id') id: string): Promise<{ driver: GetDriverDto; message: string }> {
    const driver = await this.driverService.deleteDriver(id);
    return this.formatResponse(driver, 'Driver deleted with success!');
  }

  @Get(':id/remuneration')
  async getDriverRemuneration(
    @Param('id') id: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.driverService.getDriverMonthlyRemuneration(id, month, year);
  }

}
