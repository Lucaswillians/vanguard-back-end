import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UserService } from './user.service';
import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { GetUserDto } from './dto/GetUset.dto';

@Controller('/users')
export class UserController {
  @Inject()
  private userService: UserService;

  // --------------------- Usuários CRUD ---------------------
  @Post()
  async postUser(@Body() userData: CreateUserDto) {
    const userCreated = await this.userService.createUser(userData);

    return {
      user: new GetUserDto(userCreated.id, userCreated.username, userCreated.email, userCreated.password),
      message: 'User created with success!'
    };
  }

  @UseGuards(AuthGuard)
  @Get()
  async getUser() {
    return await this.userService.getUsers();
  }

  @UseGuards(AuthGuard)
  @Get("me")
  async getMe(@Req() req: any) {
    return this.userService.getOneJWTverify(req.user.email);
  }

  @UseGuards(AuthGuard)
  @Put('/:id')
  async updateUsers(@Param('id') id: string, @Body() newData: UpdateUserDto) {
    return { user: await this.userService.updateUser(id, newData), message: 'user updated with success!' };
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  async deleteUsers(@Param('id') id: string) {
    return { user: await this.userService.deleteUser(id), message: 'user deleted with success!' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.userService.requestPasswordReset(email);
  }

  @Post('validate-code')
  async validateCode(@Body() body: { email: string; code: string }) {
    return this.userService.validateResetCode(body.email, body.code);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    return this.userService.resetPassword(body.email, body.code, body.newPassword);
  }
}
