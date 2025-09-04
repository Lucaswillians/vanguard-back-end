import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySqlConfigService } from './config/db.config.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './User/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MySqlConfigService,
    })
  ],
})
export class AppModule {}
