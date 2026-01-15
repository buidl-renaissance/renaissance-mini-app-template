import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getUserById } from '@/db/user';
import { getAppBlockById, updateAppBlock } from '@/db/appBlock';
import { uploadAppBlockIcon } from '@/utils/digitalOceanUpload';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ResponseData = {
  iconUrl?: string;
  error?: string;
};

/**
 * Helper to get current user from session
 */
async function getCurrentUser(req: NextApiRequest) {
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  
  if (sessionMatch && sessionMatch[1]) {
    return getUserById(sessionMatch[1]);
  }
  return null;
}

/**
 * POST /api/app-blocks/[id]/icon
 * 
 * Upload a cropped image or generate one with AI
 * 
 * Body:
 * - type: 'upload' | 'generate'
 * - image: string (base64) - required for upload
 * - prompt: string - required for generate
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'App Block ID is required' });
    }

    // Get the App Block and verify ownership
    const appBlock = await getAppBlockById(id);

    if (!appBlock) {
      return res.status(404).json({ error: 'App Block not found' });
    }

    if (appBlock.ownerUserId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { type, image, prompt } = req.body as {
      type: 'upload' | 'generate';
      image?: string;
      prompt?: string;
    };

    let iconUrl: string;

    if (type === 'upload') {
      // Handle direct image upload
      if (!image) {
        return res.status(400).json({ error: 'Image data is required for upload' });
      }

      iconUrl = await uploadAppBlockIcon(image, id);

    } else if (type === 'generate') {
      // Handle AI image generation
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required for AI generation' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      // Generate image with DALL-E
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `Create a modern, clean app icon for: ${prompt}. The icon should be simple, memorable, and work well at small sizes. Use a cohesive color palette. No text in the image.`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const generatedImageUrl = response.data?.[0]?.url;

      if (!generatedImageUrl) {
        return res.status(500).json({ error: 'Failed to generate image' });
      }

      // Fetch the generated image and convert to base64
      const imageResponse = await fetch(generatedImageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');

      // Upload to DigitalOcean Spaces
      iconUrl = await uploadAppBlockIcon(`data:image/png;base64,${base64Image}`, id);

    } else {
      return res.status(400).json({ error: 'Invalid type. Must be "upload" or "generate"' });
    }

    // Update the app block with the new icon URL
    await updateAppBlock(id, { iconUrl });

    console.log('✅ [POST /api/app-blocks/[id]/icon] Updated icon for App Block:', {
      id,
      type,
      iconUrl,
    });

    return res.status(200).json({ iconUrl });

  } catch (error) {
    console.error('❌ [/api/app-blocks/[id]/icon] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

// Increase body size limit for base64 images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
