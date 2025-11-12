import { Request, Response, NextFunction } from 'express';

export interface CacheOptions {
  maxAge?: number;
  public?: boolean;
  immutable?: boolean;
  staleWhileRevalidate?: number;
}

export function cacheControl(options: CacheOptions = {}) {
  const {
    maxAge = 300,
    public: isPublic = true,
    immutable = false,
    staleWhileRevalidate = 0,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const directives: string[] = [];

    if (isPublic) {
      directives.push('public');
    } else {
      directives.push('private');
    }

    directives.push(`max-age=${maxAge}`);

    if (immutable) {
      directives.push('immutable');
    }

    if (staleWhileRevalidate > 0) {
      directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}

export function noCache() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  };
}

export function withETag(req: Request, res: Response, data: any, etag: string) {
  const clientETag = req.headers['if-none-match'];
  
  if (clientETag === etag) {
    res.status(304).end();
    return true;
  }
  
  res.setHeader('ETag', etag);
  return false;
}

export const CACHE_DURATIONS = {
  NONE: 0,
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
  PERMANENT: 31536000,
} as const;
