import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebsiteHeaderMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const websiteId = req.headers['x-website-id'] as string;
    if (!websiteId) {
      return res.status(400).json({
        message: 'Missing x-website-id header',
      });
    }

    next();
  }
}
