import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoginDto, RegisterDto, rethrow } from '@goodshares/shared';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const url = `${this.config.get<string>('AUTH_SERVICE_URL')}/register`;
    try {
      const res = await firstValueFrom(this.http.post(url, body));
      return res.data;
    } catch (err) {
      rethrow(err);
    }
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const url = `${this.config.get<string>('AUTH_SERVICE_URL')}/login`;
    try {
      const res = await firstValueFrom(this.http.post(url, body));
      return res.data;
    } catch (err) {
      rethrow(err);
    }
  }
}
