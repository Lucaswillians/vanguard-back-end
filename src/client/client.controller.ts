import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from "@nestjs/common";
import { ClientService } from "./client.service";
import { CreateClientDto } from "./dto/CreateClient.dto";
import { GetClientDto } from "./dto/GetClient.dto";
import { UpdateClientDto } from "./dto/UpdateClient.dto";

@Controller('/client')
export class ClientController {
  @Inject()
  private clientService: ClientService;

  @Post()
  async postClient(@Body() clientData: CreateClientDto) {
    const clientCreated = await this.clientService.createClient(clientData)

    return {
      user: new GetClientDto(clientCreated.id, clientCreated.name, clientCreated.email, clientCreated.telephone),
      message: 'Client created with success!'
    };
  };

  // @UseGuards(AuthGuard)
  @Get()
  async getClient() {
    return await this.clientService.getClients();
  }

  // @UseGuards(AuthGuard)
  // @Get('/:id')
  // async findOne(@Param('id') id: string) {
  //   return await this.userService.getOne(id)
  // }

  // @UseGuards(AuthGuard)
  @Put('/:id')
  async updateClient(@Param('id') id: string, @Body() newData: UpdateClientDto) {
    return { user: await this.clientService.updateClient(id, newData), message: 'Client updated with success!' };
  }

  // @UseGuards(AuthGuard)
  @Delete('/:id')
  async deleteClient(@Param('id') id: string) {
    return { user: await this.clientService.deleteClient(id), message: 'Client deleted with success!' };
  }
}