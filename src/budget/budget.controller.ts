import { Controller, Post, Body, Get } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/CreateBudget.dto';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) { }

  // Calcula apenas a distância entre origem e destino
  @Post('calculate-distance')
  async calculateDistance(@Body() body: { origem: string; destino: string }) {
    return this.budgetService.calculateDistance(body.origem, body.destino);
  }

  // Retorna o preço do diesel
  @Get('diesel')
  async diesel() {
    return this.budgetService.getDieselPrice();
  }

  // Envia e-mail
  @Post('email')
  async sendEmail(@Body() emailData: { to: string; subject: string; text: string }) {
    await this.budgetService.EmailSender(emailData.to, emailData.subject, emailData.text);
    return { message: 'E-mail enviado com sucesso.' };
  }

  // Cria um orçamento
  @Post('calculate')
  async createBudget(@Body() budgetDto: CreateBudgetDto) {
    const budget = await this.budgetService.createBudget(budgetDto);
    return budget;
  }

  // Lista todos os orçamentos
  @Get('calculate')
  async getBudgets() {
    return this.budgetService.getBudgets();
  }
}
