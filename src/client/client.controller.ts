import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ClientService } from "./client.service";
import { CreateClientDto } from "./dto/CreateClient.dto";
import { GetClientDto } from "./dto/GetClient.dto";
import { UpdateClientDto } from "./dto/UpdateClient.dto";
import { AuthGuard } from "../auth/auth.guard";

@UseGuards(AuthGuard)
@Controller('/client')
export class ClientController {
  @Inject()
  private readonly clientService: ClientService;

  private formatResponse(client: any, message: string) {
    return { client, message };
  }

  @Post()
  async postClient(
    @Body() dto: CreateClientDto,
    @Req() req: Request,
  ): Promise<{ client: GetClientDto; message: string }> {
    const userId = req['user'].sub;
    const client = await this.clientService.postClient(dto, userId);
    return this.formatResponse(client, 'Driver created with success!');
  }

  @Get()
  async getClients(@Req() req: Request): Promise<GetClientDto[]> {
    const userId = req['user'].sub;
    return this.clientService.getClients(userId);
  }

  @Put('/:id')
  async updateDriver(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: Request,
  ): Promise<{ client: GetClientDto; message: string }> {
    const userId = req['user'].sub;
    const client = await this.clientService.updateClient(id, dto, userId);
    return this.formatResponse(client, 'Driver updated with success!');
  }

  @Delete('/:id')
  async deleteDriver(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ client: GetClientDto; message: string }> {
    const userId = req['user'].sub;
    const client = await this.clientService.deleteClient(id, userId);
    return this.formatResponse(client, 'Driver deleted with success!');
  }
}