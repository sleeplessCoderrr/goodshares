import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoginDto, RegisterDto, rethrow } from '@goodshares/shared';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Account created, JWT token returned' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email or username already taken' })
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
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'JWT token returned on successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
