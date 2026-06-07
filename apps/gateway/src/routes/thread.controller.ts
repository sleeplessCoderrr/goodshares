import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  AuthorMini,
  ContentDto,
  PostWithAuthor,
  RawPost,
  rethrow,
} from '@goodshares/shared';
import { AuthedRequest, JwtAuthGuard } from '../common/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('threads')
@Controller('threads')
export class ThreadController {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private postUrl() {
    return this.config.get<string>('POST_SERVICE_URL');
  }

  private userUrl() {
    return this.config.get<string>('USER_SERVICE_URL');
  }

  @Get()
  @ApiOperation({ summary: 'List all threads with author info' })
  @ApiResponse({ status: 200, description: 'Array of threads with author details' })
  async list(): Promise<PostWithAuthor[]> {
    try {
      const { data: posts } = await firstValueFrom(
        this.http.get<RawPost[]>(`${this.postUrl()}/posts`),
      );
      return await this.attachAuthors(posts);
    } catch (err) {
      rethrow(err);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single thread with all its replies' })
  @ApiParam({ name: 'id', description: 'Thread (post) ID' })
  @ApiResponse({ status: 200, description: 'Thread with nested replies and author info' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async get(@Param('id') id: string) {
    try {
      const { data } = await firstValueFrom(
        this.http.get<RawPost & { replies: RawPost[] }>(`${this.postUrl()}/posts/${id}`),
      );
      const enriched = await this.attachAuthors([data, ...data.replies]);
      const [thread, ...replies] = enriched;
      return { ...thread, replies };
    } catch (err) {
      rethrow(err);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new thread (requires authentication)' })
  @ApiBody({ type: ContentDto })
  @ApiResponse({ status: 201, description: 'Thread created successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  async create(@Req() req: AuthedRequest, @Body() dto: ContentDto) {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.postUrl()}/posts`, {
          authorId: req.user.id,
          content: dto.content,
        }),
      );
      return data;
    } catch (err) {
      rethrow(err);
    }
  }

  @Post(':id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to an existing thread (requires authentication)' })
  @ApiParam({ name: 'id', description: 'Thread (post) ID to reply to' })
  @ApiBody({ type: ContentDto })
  @ApiResponse({ status: 201, description: 'Reply created successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async reply(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: ContentDto,
  ) {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.postUrl()}/posts/${id}/replies`, {
          authorId: req.user.id,
          content: dto.content,
        }),
      );
      return data;
    } catch (err) {
      rethrow(err);
    }
  }

  private async attachAuthors(posts: RawPost[]): Promise<PostWithAuthor[]> {
    if (posts.length === 0) return [];
    const ids = Array.from(new Set(posts.map((p) => p.authorId)));
    const { data: users } = await firstValueFrom(
      this.http.post<AuthorMini[]>(`${this.userUrl()}/users/batch`, { ids }),
    );
    const byId = new Map(users.map((u) => [u.id, u]));
    return posts.map((p) => ({
      ...p,
      author:
        byId.get(p.authorId) ?? {
          id: p.authorId,
          username: 'unknown',
          displayName: 'unknown',
        },
    }));
  }
}
