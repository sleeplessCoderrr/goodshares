import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BatchUsersDto, CreateUserDto } from '@goodshares/shared';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Post('batch')
  batch(@Body() dto: BatchUsersDto) {
    return this.users.findMany(dto.ids);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
