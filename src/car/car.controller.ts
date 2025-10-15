import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from "@nestjs/common";
import { CarService } from "./car.service";
import { CreateCarDto } from "./dto/CreateCar.dto";
import { GetCarDto } from "./dto/GetCar.dto";
import { UpdateCarDto } from "./dto/UpdateCar.dto";

@Controller('/car')
export class CarController {
  @Inject()
  private carService: CarService;

  @Post()
  async postCar(@Body() carData: CreateCarDto) {
    const carCreated = await this.carService.createCar(carData)

    return {
      user: new GetCarDto(carCreated.id, carCreated.model, carCreated.plate, carCreated.consumption, carCreated.fixed_cost),
      message: 'Car created with success!'
    };
  };

  // @UseGuards(AuthGuard)
  @Get()
  async getCar() {
    return await this.carService.getCar();
  }

  // @UseGuards(AuthGuard)
  // @Get('/:id')
  // async findOne(@Param('id') id: string) {
  //   return await this.userService.getOne(id)
  // }

  // @UseGuards(AuthGuard)
  @Put('/:id')
  async updateCar(@Param('id') id: string, @Body() newData: UpdateCarDto) {
    return { user: await this.carService.updateCar(id, newData), message: 'Car updated with success!' };
  }

  // @UseGuards(AuthGuard)
  @Delete('/:id')
  async deleteCar(@Param('id') id: string) {
    return { user: await this.carService.deleteCar(id), message: 'Car deleted with success!' };
  }
}