export class GetUserDto {
  constructor(readonly id: string, readonly username: string, readonly email: string, readonly password: string) { }
}