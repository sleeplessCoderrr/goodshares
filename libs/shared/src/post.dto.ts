import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContentDto {
  @ApiProperty({ example: 'What a great day to share something!', minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content!: string;
}

export class CreatePostDto extends ContentDto {
  @ApiProperty({ example: 'clx1234abcdef' })
  @IsString()
  authorId!: string;
}

export class CreateReplyDto extends ContentDto {
  @ApiProperty({ example: 'clx1234abcdef' })
  @IsString()
  authorId!: string;
}
