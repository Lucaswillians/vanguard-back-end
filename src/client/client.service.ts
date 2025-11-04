import { ForbiddenException, Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientEntity } from "./client.entity";
import { CreateClientDto } from "./dto/CreateClient.dto";
import { GetClientDto } from "./dto/GetClient.dto";
import { UpdateClientDto } from "./dto/UpdateClient.dto";
import { UserEntity } from "../User/user.entity";

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  @InjectRepository(ClientEntity)
  private readonly clientRepository: Repository<ClientEntity>;

  async postClient(clientData: CreateClientDto, userId: string) {
    this.logger.log(`Criando cliente para usuário ${userId}`);
    try {
      const client = this.clientRepository.create({
        ...clientData,
        user: { id: userId } as any,
      });
      const savedClient = await this.clientRepository.save(client);
      this.logger.log(`Cliente criado com sucesso: ${savedClient.id}`);
      return savedClient;
    } 
    catch (err) {
      this.logger.error(`Erro ao criar cliente para usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao criar cliente: ${err.message}`);
    }
  }

  async getClients(userId: string) {
    this.logger.log(`Buscando clientes do usuário ${userId}`);
    try {
      const clients = await this.clientRepository.find({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      this.logger.log(`Total de clientes encontrados: ${clients.length}`);
      return clients.map(client => new GetClientDto(
        client.id,
        client.name,
        client.email,
        client.telephone
      ));
    } 
    catch (err) {
      this.logger.error(`Erro ao buscar clientes do usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao buscar clientes: ${err.message}`);
    }
  }

  async findById(id: string, userId: string): Promise<ClientEntity> {
    this.logger.log(`Buscando cliente ${id} do usuário ${userId}`);
    try {
      const client = await this.clientRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['user'],
      });
      if (!client) {
        this.logger.warn(`Cliente ${id} não encontrado para usuário ${userId}`);
        throw new NotFoundException('Cliente não encontrado');
      }
      return client;
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao buscar cliente ${id}`, err.stack);
      throw new BadRequestException(`Erro ao buscar cliente: ${err.message}`);
    }
  }

  async updateClient(id: string, newData: UpdateClientDto, userId: string) {
    this.logger.log(`Atualizando cliente ${id} do usuário ${userId}`);
    try {
      const client = await this.findById(id, userId);
      if (!client) {
        this.logger.warn(`Acesso negado ao atualizar cliente ${id}`);
        throw new ForbiddenException('Acesso negado a este cliente');
      }
      await this.clientRepository.update(id, newData);
      const updatedClient = await this.findById(id, userId);
      this.logger.log(`Cliente ${id} atualizado com sucesso`);
      return updatedClient;
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao atualizar cliente ${id}`, err.stack);
      throw new BadRequestException(`Erro ao atualizar cliente: ${err.message}`);
    }
  }

  async deleteClient(id: string, userId: string) {
    this.logger.log(`Deletando cliente ${id} do usuário ${userId}`);
    try {
      const client = await this.findById(id, userId);
      if (!client) {
        this.logger.warn(`Acesso negado ao deletar cliente ${id}`);
        throw new ForbiddenException('Acesso negado a este cliente');
      }
      await this.clientRepository.delete(id);
      this.logger.log(`Cliente ${id} deletado com sucesso`);
      return { message: 'Cliente deletado com sucesso' };
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao deletar cliente ${id}`, err.stack);
      throw new BadRequestException(`Erro ao deletar cliente: ${err.message}`);
    }
  }
}
