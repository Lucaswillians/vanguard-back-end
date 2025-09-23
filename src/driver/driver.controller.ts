import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/CreateDriver.dto';

@Controller('/driver')
export class DriverController {
  @Inject()
  private readonly driverService: DriverService;

  @Post()
  async postDriver(@Body() dto: CreateDriverDto) {
    const driver = await this.driverService.createDriver(dto);
    return { user: driver, message: 'Driver created with success!' };
  }

  @Get()
  async getDrivers() {
    return await this.driverService.getDrivers();
  }
}
