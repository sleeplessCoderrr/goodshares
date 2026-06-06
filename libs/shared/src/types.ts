export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export interface AuthorMini {
  id: string;
  username: string;
  displayName: string;
}

export interface RawPost {
  id: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface PostWithAuthor extends RawPost {
  author: AuthorMini;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
}
