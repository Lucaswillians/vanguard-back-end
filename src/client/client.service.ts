import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientEntity } from "./client.entity";
import { CreateClientDto } from "./dto/CreateClient.dto";
import { GetClientDto } from "./dto/GetClient.dto";
import { UpdateClientDto } from "./dto/UpdateClient.dto";
import { UserEntity } from "../User/user.entity";

@Injectable()
export class ClientService {
  @InjectRepository(ClientEntity)
  private readonly clientRepository: Repository<ClientEntity>;

  async postClient(clientData: CreateClientDto, userId: string) {
    try {
      const client = this.clientRepository.create({
        ...clientData,
        user: { id: userId } as any,
      });
      return await this.clientRepository.save(client);
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao criar cliente: ${err.message}`);
    }
  }

  async getClients(userId: string) {
    try {
      const clients = await this.clientRepository.find({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      return clients.map(client => new GetClientDto(
        client.id,
        client.name,
        client.email,
        client.telephone
      ));
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao buscar clientes: ${err.message}`);
    }
  }

  async findById(id: string, userId: string): Promise<ClientEntity> {
    try {
      const client = await this.clientRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['user'],
      });
      if (!client) throw new NotFoundException('Cliente não encontrado');
      return client;
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao buscar cliente: ${err.message}`);
    }
  }

  async updateClient(id: string, newData: UpdateClientDto, userId: string) {
    try {
      const client = await this.findById(id, userId);
      if (!client) throw new ForbiddenException('Acesso negado a este cliente');
     
      await this.clientRepository.update(id, newData);
      return this.findById(id, userId);
    }
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao atualizar cliente: ${err.message}`);
    }
  }

  async deleteClient(id: string, userId: string) {
    try {
      const client = await this.findById(id, userId);
      if (!client) throw new ForbiddenException('Acesso negado a este cliente');
     
      await this.clientRepository.delete(id);
      return { message: 'Cliente deletado com sucesso' };
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao deletar cliente: ${err.message}`);
    }
  }
}
