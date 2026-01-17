import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';
import { 
  createDraftAppBlock, 
  updateOnboardingProgress,
  getDraftBlocksByUser,
  getAppBlockById,
} from '@/db/appBlock';
import type { AppBlock, OnboardingStage } from '@/db/schema';

interface SummaryData {
  name: string;
  tagline: string;
  description: string;
  targetAudience: string;
  coreFeatures: string[];
  nextSteps: string[];
}

type ResponseData = {
  success?: boolean;
  appBlock?: AppBlock;
  appBlocks?: AppBlock[];
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
 * POST /api/pending-blocks - Create or update a draft app block
 * GET /api/pending-blocks - Get user's draft blocks
 * PATCH /api/pending-blocks - Update an existing draft block's progress
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    switch (req.method) {
      case 'GET': {
        const appBlocks = await getDraftBlocksByUser(user.id);
        return res.status(200).json({ appBlocks });
      }

      case 'POST': {
        const { blockName, blockType, summary, processedAnswers } = req.body as {
          blockName: string;
          blockType: string;
          summary: SummaryData;
          processedAnswers?: object[];
        };

        // Validate required fields
        if (!blockName || typeof blockName !== 'string' || blockName.trim().length === 0) {
          return res.status(400).json({ error: 'Block name is required' });
        }

        if (!blockType || typeof blockType !== 'string') {
          return res.status(400).json({ error: 'Block type is required' });
        }

        if (!summary || typeof summary !== 'object') {
          return res.status(400).json({ error: 'Summary data is required' });
        }

        // Create the draft app block
        const appBlock = await createDraftAppBlock({
          name: blockName.trim(),
          ownerUserId: user.id,
          blockType,
          onboardingData: { 
            summary, 
            processedAnswers: processedAnswers || [] 
          },
        });

        // Update to followup stage since we have the summary
        await updateOnboardingProgress(appBlock.id, {
          onboardingStage: 'followup',
          onboardingData: { 
            summary, 
            processedAnswers: processedAnswers || [] 
          },
        });

        const updatedBlock = await getAppBlockById(appBlock.id);

        console.log('✅ [POST /api/pending-blocks] Created draft app block:', {
          id: appBlock.id,
          name: appBlock.name,
          userId: user.id,
        });

        return res.status(201).json({
          success: true,
          appBlock: updatedBlock || appBlock,
        });
      }

      case 'PATCH': {
        const { appBlockId, onboardingStage, onboardingData, name, description } = req.body as {
          appBlockId: string;
          onboardingStage?: OnboardingStage;
          onboardingData?: object;
          name?: string;
          description?: string;
        };

        if (!appBlockId) {
          return res.status(400).json({ error: 'App block ID is required' });
        }

        // Verify ownership
        const existingBlock = await getAppBlockById(appBlockId);
        if (!existingBlock) {
          return res.status(404).json({ error: 'App block not found' });
        }
        if (existingBlock.ownerUserId !== user.id) {
          return res.status(403).json({ error: 'Not authorized to update this block' });
        }

        // Update the block's progress
        const updatedBlock = await updateOnboardingProgress(appBlockId, {
          onboardingStage,
          onboardingData,
          name,
          description,
        });

        console.log('✅ [PATCH /api/pending-blocks] Updated app block:', {
          id: appBlockId,
          stage: onboardingStage,
        });

        return res.status(200).json({
          success: true,
          appBlock: updatedBlock || undefined,
        });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ [/api/pending-blocks] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
