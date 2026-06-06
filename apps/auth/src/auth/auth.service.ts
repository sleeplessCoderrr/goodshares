import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import {
  AuthResult,
  JwtPayload,
  LoginDto,
  RegisterDto,
} from '@goodshares/shared';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.credential.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('email already registered');

    const userServiceUrl = this.config.get<string>('USER_SERVICE_URL');
    let createdUser: { id: string; username: string; displayName: string };
    try {
      const res = await firstValueFrom(
        this.http.post(`${userServiceUrl}/users`, {
          username: dto.username,
          displayName: dto.displayName,
        }),
      );
      createdUser = res.data;
    } catch (err: any) {
      if (err?.response?.status === 409) throw new ConflictException('username already taken');
      throw new InternalServerErrorException('failed to create user profile');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      await this.prisma.credential.create({
        data: { email: dto.email, passwordHash, userId: createdUser.id },
      });
    } catch (err) {
      try {
        await firstValueFrom(this.http.delete(`${userServiceUrl}/users/${createdUser.id}`));
      } catch {}
      throw err;
    }

    return this.issueToken(createdUser.id, dto.email, createdUser.username, createdUser.displayName);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const credential = await this.prisma.credential.findUnique({ where: { email: dto.email } });
    if (!credential) throw new UnauthorizedException('invalid credentials');
    const ok = await bcrypt.compare(dto.password, credential.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid credentials');

    const userServiceUrl = this.config.get<string>('USER_SERVICE_URL');
    const res = await firstValueFrom(this.http.get(`${userServiceUrl}/users/${credential.userId}`));
    const user = res.data as { username: string; displayName: string };
    return this.issueToken(credential.userId, dto.email, user.username, user.displayName);
  }

  private issueToken(
    userId: string,
    email: string,
    username: string,
    displayName: string,
  ): AuthResult {
    const payload: JwtPayload = { sub: userId, email, username };
    const token = this.jwt.sign(payload);
    return { token, user: { id: userId, email, username, displayName } };
  }
}
