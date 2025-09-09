import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySqlConfigService } from './config/db.config.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './User/user.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    ClientModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MySqlConfigService,
    })
  ],
})
export class AppModule {}
