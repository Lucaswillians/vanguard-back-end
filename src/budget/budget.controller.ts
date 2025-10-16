import { Controller, Post, Body, Get, Inject, Put, Param } from '@nestjs/common';
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
  async create(@Body() dto: CreateBudgetDto): Promise<BudgetEntity> {
    const budget = await this.budgetService.createBudget(dto);
    return budget;
  }

  @Get()
  async getAllBudgets() {
    return await this.budgetService.getAllBudgets();
  }

  @Get('trips')
  async getAllTrips() {
    return await this.budgetService.getAllTrips();
  }

  @Put(':id')
  async updateBudget(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const updatedBudget = await this.budgetService.updateBudget(id, updateBudgetDto);
    return {
      message: 'Budget updated successfully!',
      data: updatedBudget,
    };
  }
}
