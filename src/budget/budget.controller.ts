import {
  Controller,
  Post,
  Body,
  Get,
  Inject,
  Put,
  Param,
  Req,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/CreateBudget.dto';
import { UpdateBudgetDto } from './dto/UpdateBudget.dto';
import { BudgetEntity } from './budget.entity';
import { GetBudgetDto } from './dto/GetBudget.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateBudgetStatusDto } from './dto/UpdateBudgetStatus.dto';

@Controller('budget')
@UseGuards(AuthGuard) 
export class BudgetController {
  @Inject()
  private readonly budgetService: BudgetService;

  @Post()
  async create(
    @Body() dto: CreateBudgetDto,
    @Req() req: any,
  ): Promise<BudgetEntity> {
    const userId = req.user?.sub;
    return this.budgetService.createBudget(dto, userId);
  }


  @Get()
  async getAllBudgets(@Req() req: any): Promise<GetBudgetDto[]> {
    const userId = req.user?.sub;
    return this.budgetService.getAllBudgets(userId);
  }


  @Get('trips')
  async getAllTrips(@Req() req: any) {
    const userId = req.user?.sub;
    return this.budgetService.getAllTrips(userId);
  }

  @Put(':id')
  async updateBudget(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;

    const updatedBudget = await this.budgetService.updateBudget(
      id,
      updateBudgetDto,
      userId,
    );

    return {
      message: 'Orçamento atualizado com sucesso!',
      data: updatedBudget,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetStatusDto,
    @Req() req,
  ) {
    return this.budgetService.updateBudgetStatus(id, dto, req.user.id);
  }

  @Delete(':id')
  async deleteBudget(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.budgetService.deleteBudget(id, userId);
  }
}
