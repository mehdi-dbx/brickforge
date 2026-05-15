import {
  Router,
  type Request,
  type Response,
  type Router as RouterType,
} from 'express';
import { isDatabaseAvailable } from '@chat-template/db';

export const configRouter: RouterType = Router();

/**
 * GET /api/config - Get application configuration
 * Returns feature flags based on environment configuration
 */
configRouter.get('/', (_req: Request, res: Response) => {
  const features: Record<string, boolean> = {
    chatHistory: isDatabaseAvailable(),
  };

  // Auto-discover PROJECT_TOOL_* feature toggles from env
  for (const [key, val] of Object.entries(process.env)) {
    if (key.startsWith('PROJECT_TOOL_')) {
      const slug = key.replace('PROJECT_TOOL_', '').toLowerCase();
      features[slug] = !!val?.trim() && val.trim().toLowerCase() !== 'false';
    }
  }

  // Voice also requires OPENAI_API_KEY to be set
  if (features.voice && !process.env.OPENAI_API_KEY?.trim()) {
    features.voice = false;
  }

  res.json({ features });
});
