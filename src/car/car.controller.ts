import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { CarService } from "./car.service";
import { CreateCarDto } from "./dto/CreateCar.dto";
import { GetCarDto } from "./dto/GetCar.dto";
import { UpdateCarDto } from "./dto/UpdateCar.dto";
import { AuthGuard } from "../auth/auth.guard";

@UseGuards(AuthGuard)
@Controller('/car')
export class CarController {
  @Inject()
  private readonly carService: CarService;

  private formatResponse(car: any, message: string) {
    return { car, message };
  }

  @Post()
  async postCar(
    @Body() dto: CreateCarDto,
    @Req() req: Request,
  ): Promise<{ car: GetCarDto; message: string }> {
    const userId = req['user'].sub;
    const car = await this.carService.createCar(dto, userId);
    return this.formatResponse(car, 'Driver created with success!');
  }

  @Get()
  async getCar(@Req() req: Request): Promise<GetCarDto[]> {
    const userId = req['user'].sub;
    return this.carService.getCar(userId);
  }

  @Put('/:id')
  async updateCar(
    @Param('id') id: string,
    @Body() dto: UpdateCarDto,
    @Req() req: Request,
  ): Promise<{ car: GetCarDto; message: string }> {
    const userId = req['user'].sub;
    const car = await this.carService.updateCar(id, dto, userId);
    return this.formatResponse(car, 'Driver updated with success!');
  }

  @Delete('/:id')
  async deleteDriver(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ car: GetCarDto; message: string }> {
    const userId = req['user'].sub;
    const car = await this.carService.deleteCar(id, userId);
    return this.formatResponse(car, 'Driver deleted with success!');
  }
}