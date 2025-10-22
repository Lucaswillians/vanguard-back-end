import { Controller, Post, Body, Get, Inject, Put, Param, Req } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/CreateBudget.dto';
import { BudgetEntity } from './budget.entity';
import { GetBudgetDto } from './dto/GetBudget.dto';
import { UpdateBudgetDto } from './dto/UpdateBudget.dto';

@Controller('budget')
export class BudgetController {
  @Inject()
  private readonly budgetService: BudgetService

  @Get('mock')
  async getMockBudget() {
    return this.budgetService.createBudgetMock();
  }

  @Post()
  async create(@Body() dto: CreateBudgetDto, @Req() req: any): Promise<BudgetEntity> {
    const userId = req.user?.sub; 
    return this.budgetService.createBudget(dto, userId);
  }

  @Get()
  async getAllBudgets() {
    return await this.budgetService.getAllBudgets();
  }

  @Get('mock')
  async getMock() {
    return await this.budgetService.createBudgetMock()
  }

  @Get('trips')
  async getAllTrips() {
    return await this.budgetService.getAllTrips();
  }

  @Put(':id')
  async updateBudget(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub; 

    const updatedBudget = await this.budgetService.updateBudget(id, updateBudgetDto, userId);

    return {
      message: 'Budget updated successfully!',
      data: updatedBudget,
    };
  }
}
