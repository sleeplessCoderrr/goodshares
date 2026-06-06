import { IsString, MaxLength, MinLength } from 'class-validator';

export class ContentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content!: string;
}

export class CreatePostDto extends ContentDto {
  @IsString()
  authorId!: string;
}

export class CreateReplyDto extends ContentDto {
  @IsString()
  authorId!: string;
}
