import type { MetadataRoute } from 'next';
import { getRobotsConfig } from '@/config/env';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return getRobotsConfig(process.env);
}
