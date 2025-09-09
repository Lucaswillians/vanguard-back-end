import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientEntity } from "./client.entity";
import { CreateClientDto } from "./dto/CreateClient.dto";
import { GetClientDto } from "./dto/GetClient.dto";
import { UpdateClientDto } from "./dto/UpdateClient.dto";

@Injectable()
export class ClientService {
  @InjectRepository(ClientEntity)
  private readonly clientRepository: Repository<ClientEntity>

  async createClient (clientData: CreateClientDto){
    const clientEntity = new ClientEntity()

    clientEntity.name = clientData.name
    clientEntity.email = clientData.email
    clientEntity.telephone = clientData.telephone

    return this.clientRepository.save(clientEntity)
  }

  async getClients() {
    const savedClient = await this.clientRepository.find();
    const clientList = savedClient.map((user) => new GetClientDto(user.id, user.name, user.email, user.telephone));

    return clientList;
  }

  async updateClient(id: string, newData: UpdateClientDto) {
    await this.clientRepository.update(id, newData);
  }

  async deleteClient(id: string) {
    await this.clientRepository.delete(id);
  }
}