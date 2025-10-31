import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
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
  private readonly clientRepository: Repository<ClientEntity>

  async postClient (clientData: CreateClientDto, userId: string){
    const client = this.clientRepository.create({
      ...clientData,
      user: { id: userId } as UserEntity,
    });

    return await this.clientRepository.save(client);
  }

  async getClients(userId: string) {
    return this.clientRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findById(id: string, userId: string): Promise<ClientEntity> {
    const client = await this.clientRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async updateClient(id: string, newData: UpdateClientDto, userId: string) {
    const client = await this.findById(id, userId);
    if (!client) throw new ForbiddenException('Acesso negado a este cliente');

    await this.clientRepository.update(id, newData);
    return this.findById(id, userId);
  }

  async deleteClient(id: string, userId: string) {
    const client = await this.findById(id, userId);
    if (!client) throw new ForbiddenException('Acesso negado a este motorista');

    return this.clientRepository.delete(id);
  }
}