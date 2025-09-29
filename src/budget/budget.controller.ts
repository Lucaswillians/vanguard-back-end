import { Controller, Post, Body, Get } from '@nestjs/common';
import { BudgetService } from './budget.service';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) { }

  @Post('calculate')
  async calculate(@Body() body: { origem: string; destino: string }) {
    return this.budgetService.calculateDistance(body.origem, body.destino);
  }

  @Get('Diesel')
  async diesel() {
    return this.budgetService.GetDiesel();
  }
}
