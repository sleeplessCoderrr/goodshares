import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto, CreateReplyDto } from '@goodshares/shared';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  createThread(dto: CreatePostDto) {
    return this.prisma.post.create({
      data: { authorId: dto.authorId, content: dto.content, parentId: null },
    });
  }

  async createReply(parentId: string, dto: CreateReplyDto) {
    const parent = await this.prisma.post.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('parent post not found');
    return this.prisma.post.create({
      data: { authorId: dto.authorId, content: dto.content, parentId },
    });
  }

  listThreads() {
    return this.prisma.post.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getThreadWithReplies(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    if (!post) throw new NotFoundException('post not found');
    return post;
  }
}
