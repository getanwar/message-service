import { Request } from 'express';

export const getWebsiteId = (req: Request): string => {
  const websiteId = req.headers['x-website-id'] as string;
  if (!websiteId) {
    throw new Error('Missing x-website-id header');
  }
  return websiteId;
};
