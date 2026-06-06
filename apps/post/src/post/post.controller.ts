import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePostDto, CreateReplyDto } from '@goodshares/shared';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly posts: PostService) {}

  @Get()
  list() {
    return this.posts.listThreads();
  }

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.posts.createThread(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.posts.getThreadWithReplies(id);
  }

  @Post(':id/replies')
  reply(@Param('id') id: string, @Body() dto: CreateReplyDto) {
    return this.posts.createReply(id, dto);
  }
}
