import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { getUserById } from '@/db/user';
import { 
  createPendingBlock, 
  getPendingBlocksByUser,
  markNotificationSent,
  hasPendingBlockWithName
} from '@/db/pendingBlock';
import type { PendingAppBlock } from '@/db/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

const NOTIFICATION_EMAIL = 'john@dpop.tech';

interface PRDData {
  title: string;
  version: string;
  createdAt: string;
  overview: {
    name: string;
    tagline: string;
    description: string;
    problemStatement: string;
  };
  targetAudience: {
    primary: string;
    demographics: string[];
    painPoints: string[];
  };
  features: {
    core: { name: string; description: string; priority: string }[];
    future: string[];
  };
  technicalRequirements: string[];
  successMetrics: string[];
  timeline: { phase: string; description: string }[];
  risks: string[];
}

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
  pendingBlock?: PendingAppBlock;
  pendingBlocks?: PendingAppBlock[];
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
 * Send notification email about new pending block
 */
async function sendNotificationEmail(
  pendingBlock: PendingAppBlock,
  prd: PRDData,
  summary: SummaryData | null,
  userName: string
): Promise<boolean> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.builddetroit.xyz';
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #a78bfa 0%, #f5d764 150%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 8px; }
    .feature { background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #a78bfa; }
    .feature-name { font-weight: 600; }
    .feature-desc { font-size: 14px; color: #6b7280; }
    .priority { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 100px; margin-left: 8px; }
    .priority-must { background: #a78bfa33; color: #7c3aed; }
    .priority-should { background: #f5d76433; color: #b8860b; }
    .meta { font-size: 14px; color: #6b7280; }
    .cta { text-align: center; margin-top: 24px; }
    .button { display: inline-block; background: #a78bfa; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ New Block Submission</h1>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Block Details</div>
        <p><strong>${prd.overview.name}</strong></p>
        <p style="font-style: italic; color: #7c3aed;">${prd.overview.tagline}</p>
        <p class="meta">Type: ${pendingBlock.blockType} • Submitted by: ${userName}</p>
      </div>

      <div class="section">
        <div class="section-title">Problem Statement</div>
        <p>${prd.overview.problemStatement}</p>
      </div>

      <div class="section">
        <div class="section-title">Description</div>
        <p>${prd.overview.description}</p>
      </div>

      <div class="section">
        <div class="section-title">Target Audience</div>
        <p><strong>${prd.targetAudience.primary}</strong></p>
        <p class="meta">Demographics: ${prd.targetAudience.demographics.join(', ')}</p>
        <p class="meta">Pain Points: ${prd.targetAudience.painPoints.join(', ')}</p>
      </div>

      <div class="section">
        <div class="section-title">Core Features</div>
        ${prd.features.core.map(f => `
          <div class="feature">
            <span class="feature-name">${f.name}</span>
            <span class="priority priority-${f.priority === 'must-have' ? 'must' : 'should'}">${f.priority}</span>
            <div class="feature-desc">${f.description}</div>
          </div>
        `).join('')}
      </div>

      ${prd.features.future.length > 0 ? `
      <div class="section">
        <div class="section-title">Future Features</div>
        <p class="meta">${prd.features.future.join(' • ')}</p>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Technical Requirements</div>
        <ul>
          ${prd.technicalRequirements.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <div class="section-title">Success Metrics</div>
        <ul>
          ${prd.successMetrics.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <div class="section-title">Timeline</div>
        ${prd.timeline.map(t => `<p><strong>${t.phase}:</strong> ${t.description}</p>`).join('')}
      </div>

      <div class="section">
        <div class="section-title">Risks & Challenges</div>
        <ul>
          ${prd.risks.map(r => `<li>⚠️ ${r}</li>`).join('')}
        </ul>
      </div>

      <div class="meta" style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        Block ID: ${pendingBlock.id}<br>
        Submitted: ${new Date(pendingBlock.createdAt).toLocaleString()}
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: 'Renaissance City <noreply@builddetroit.xyz>',
      to: [NOTIFICATION_EMAIL],
      subject: `🏗️ New Block Submission: ${prd.overview.name}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error sending notification email:', err);
    return false;
  }
}

/**
 * POST /api/pending-blocks - Submit a new pending block
 * GET /api/pending-blocks - Get user's pending blocks
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
        const pendingBlocks = await getPendingBlocksByUser(user.id);
        return res.status(200).json({ pendingBlocks });
      }

      case 'POST': {
        const { blockName, blockType, prd, summary } = req.body as {
          blockName: string;
          blockType: string;
          prd: PRDData;
          summary?: SummaryData;
        };

        // Validate required fields
        if (!blockName || typeof blockName !== 'string' || blockName.trim().length === 0) {
          return res.status(400).json({ error: 'Block name is required' });
        }

        if (!blockType || typeof blockType !== 'string') {
          return res.status(400).json({ error: 'Block type is required' });
        }

        if (!prd || typeof prd !== 'object') {
          return res.status(400).json({ error: 'PRD data is required' });
        }

        // Check for duplicate pending submissions
        const hasDuplicate = await hasPendingBlockWithName(user.id, blockName);
        if (hasDuplicate) {
          return res.status(400).json({ 
            error: 'You already have a pending submission with this name' 
          });
        }

        // Create the pending block
        const pendingBlock = await createPendingBlock({
          userId: user.id,
          blockName: blockName.trim(),
          blockType,
          prdData: JSON.stringify(prd),
          summaryData: summary ? JSON.stringify(summary) : null,
          status: 'pending',
          notificationSent: false,
        });

        console.log('✅ [POST /api/pending-blocks] Created pending block:', {
          id: pendingBlock.id,
          blockName: pendingBlock.blockName,
          userId: pendingBlock.userId,
        });

        // Send notification email
        const userName = user.displayName || user.username || 'Anonymous User';
        const emailSent = await sendNotificationEmail(pendingBlock, prd, summary || null, userName);
        
        if (emailSent) {
          await markNotificationSent(pendingBlock.id);
          console.log('✅ [POST /api/pending-blocks] Notification email sent');
        } else {
          console.warn('⚠️ [POST /api/pending-blocks] Failed to send notification email');
        }

        return res.status(201).json({
          success: true,
          pendingBlock,
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
