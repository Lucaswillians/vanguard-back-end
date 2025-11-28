# Vanguard – Backend

Backend oficial do sistema Vanguard, responsável por toda a regra de negócio, autenticação, segurança, controle financeiro, cálculos de remuneração, comunicação com motoristas e integração total com o sistema de gestão de viagens e turismo.

Este serviço garante performance, estabilidade e segurança, fornecendo APIs confiáveis para o frontend e demais integrações.

---

## 🚀 Visão Geral

O backend do Vanguard foi desenvolvido para solucionar problemas críticos enfrentados por empresas de turismo e transporte de passageiros, como:

- Falta de centralização de informações;
- Cálculos manuais de custos e remunerações;
- Falhas organizacionais devido ao uso de planilhas;
- Comunicação ineficiente com motoristas;
- Falta de automação em processos operacionais.

Todo o núcleo da aplicação — cálculos, regras de negócio, validações, segurança, geração de documentos e envio de emails — está implementado no backend.

---

## 🛠 Tecnologias Utilizadas

### **Core**
- **Node.js** (versão 22)
- **NestJS** – Arquitetura modular e altamente escalável
- **TypeORM** – ORM para banco MySQL
- **MySQL** – Banco de dados relacional
- **Docker + Docker Compose** – Infraestrutura de desenvolvimento

### **Autenticação e Segurança**
- **JWT** – Autenticação baseada em tokens
- **bcrypt** – Hash de senhas
- **2FA (Two-Factor Authentication)** – Autenticação de dois fatores
- **reCAPTCHA** – Proteção contra bots

### **Infraestrutura e Monitoramento**
- **Papertrail** – Monitoramento de logs
- **SonarCloud** – Análise contínua de qualidade do código

### **Serviços Integrados**
- **SMTP Google** – Sistema próprio de envio de emails transacionais (notificações de viagens, credenciais, etc.)


### **APIs Externas**
#### **API de Preço do Diesel – CombustívelAPI**
Integração com a API pública **CombustívelAPI**, utilizada para obter o preço médio atualizado do diesel no estado de **Santa Catarina (SC)**.

- Dados retornados incluem:
  - preço médio do diesel,
  - data da coleta,
  - fonte oficial.
- Utilizada para cálculos de custos e orçamentos.
- Mecanismos implementados:
  - validação e sanitização de dados,
  - tratamento de erros e logs detalhados,
  - **retry automático** em caso de falha,
  - **fallback** com último valor válido armazenado.

#### **API de Localização e Distâncias – Nominatim + OSRM**
Integração com serviços baseados no OpenStreetMap:

- **Nominatim**  
  Busca coordenadas geográficas (latitude e longitude) a partir do nome das cidades.

- **OSRM**  
  Calcula distância real de condução e duração estimada entre dois pontos.

- Informações utilizadas para:
  - criação de orçamentos,
  - cálculo de custo de combustível,
  - planejamento de rotas.

- Inclui:
  - tratamento de erros robusto,
  - logs em todas as etapas (geocodificação e rotas),
  - **fallback** com dados previamente armazenados.


---

## 📦 Funcionalidades do Backend

- Processamento de toda a lógica de negócios do sistema
- Cálculo de remuneração de motoristas
- Cálculo financeiro de despesas e receitas
- Geração e envio de emails via SMTP Google
- Autenticação JWT + 2FA + reCAPTCHA
- Gestão de motoristas, viagens, orçamentos e custos
- Geração e envio de PDFs (via endpoints)
- Logs estruturados enviados ao Papertrail
- Qualidade de código monitorada pelo SonarCloud
- API REST padronizada consumida pelo frontend

---

## ⚙️ Como Rodar o Projeto
```
git clone <[seu-repositório](https://github.com/Lucaswillians/vanguard-back-end)>

cd vanguard-back-end
```


### **1. Criar o arquivo `.env.local`**
Inclua todas as variáveis necessárias para:
- MySQL
- SMTP Google
- JWT
- reCAPTCHA
- Configurações gerais do NestJS

Exemplo mínimo:

  ```env
  DATABASE_HOST=localhost
  DATABASE_PORT=3306
  DATABASE_USER=root
  DATABASE_PASS=senha
  DATABASE_NAME=vanguard
  
  JWT_SECRET=seu_jwt_secret
  
  SMTP_USER=email@gmail.com
  SMTP_PASS=senha_do_app
  
  RECAPTCHA_SECRET=chave_recaptcha
```
## Usar o .env.local no arquivo main.ts

# Rodar o docker para subir o mysql local:
  ```
    docker compose up -d
  ```
## Com o docker rodando o mysql local, basta rodar 
```
  npm run start:dev
```

para usar o backend de forma local na porta localhost:3000

# Todo o deploy foi feito na hostinger através de uma VPS, subindo o backend e o mysql.



