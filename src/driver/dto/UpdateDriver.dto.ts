import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './CreateDriver.dto';

export class UpdateDriverDto extends PartialType(CreateDriverDto) { }
