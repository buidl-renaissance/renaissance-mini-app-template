import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProcessedAnswer {
  question: string;
  answer: string;
  keyPoints: string[];
}

interface BlockSummary {
  name: string;
  tagline: string;
  description: string;
  targetAudience: string;
  coreFeatures: string[];
  nextSteps: string[];
}

interface FollowUpQuestion {
  id: string;
  question: string;
  context: string;
  type: 'single' | 'multi' | 'open';
  options?: string[];
}

interface ProductRequirementsDocument {
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
    core: { name: string; description: string; priority: 'must-have' | 'should-have' | 'nice-to-have' }[];
    future: string[];
  };
  technicalRequirements: string[];
  successMetrics: string[];
  timeline: { phase: string; description: string }[];
  risks: string[];
}

interface ProcessAnswersResponse {
  success: boolean;
  answers?: ProcessedAnswer[];
  summary?: BlockSummary;
  followUpQuestions?: FollowUpQuestion[];
  prd?: ProductRequirementsDocument;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProcessAnswersResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { transcript, questions, blockType, blockName, isFollowUp, previousAnswers, previousSummary } = req.body;

  if (!transcript || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing transcript or questions' 
    });
  }

  let systemPrompt: string;
  let userPrompt: string;

  if (isFollowUp && previousAnswers && previousSummary) {
    // Follow-up processing - generate formal PRD from all collected information
    systemPrompt = `You are a product manager helping someone build a "${blockType}" block called "${blockName || 'their block'}" for Renaissance City, a community platform in Detroit.

They've answered initial questions and follow-up clarifying questions. Your job is to:
1. Record their follow-up answers
2. Generate a comprehensive Product Requirements Document (PRD) that can be used to build their app block

Be professional and thorough.`;

    userPrompt = `Here is their previous summary:
${JSON.stringify(previousSummary, null, 2)}

Here are their initial answers:
${previousAnswers.map((a: ProcessedAnswer) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}

Here are the follow-up questions and their responses:
${transcript}

Please analyze ALL of this and return a JSON object with:

1. "answers" - an array of objects for the follow-up questions, each with:
   - "question": the follow-up question
   - "answer": their selected answer(s) or text response
   - "keyPoints": array of 1-2 key implications of their choice

2. "summary" - an UPDATED summary object:
   - "name": "${previousSummary.name}"
   - "tagline": refined tagline
   - "description": comprehensive 2-3 sentence description
   - "targetAudience": refined audience description  
   - "coreFeatures": array of 3-5 core features
   - "nextSteps": array of 2-3 concrete next steps

3. "prd" - a formal Product Requirements Document object:
   - "title": "Product Requirements: ${previousSummary.name}"
   - "version": "1.0"
   - "createdAt": "${new Date().toISOString().split('T')[0]}"
   - "overview": {
       "name": the block name,
       "tagline": catchy tagline,
       "description": detailed 3-4 sentence description,
       "problemStatement": what problem this solves (1-2 sentences)
     }
   - "targetAudience": {
       "primary": main user description,
       "demographics": array of 2-4 demographic characteristics,
       "painPoints": array of 2-4 pain points this addresses
     }
   - "features": {
       "core": array of 3-5 objects with "name", "description", and "priority" (must-have/should-have/nice-to-have),
       "future": array of 2-3 future feature ideas
     }
   - "technicalRequirements": array of 2-4 technical needs
   - "successMetrics": array of 3-4 measurable success criteria
   - "timeline": array of 2-3 phases with "phase" name and "description"
   - "risks": array of 2-3 potential risks or challenges

Return ONLY valid JSON, no markdown or explanation.`;

  } else {
    // Initial processing
    systemPrompt = `You are helping someone build a "${blockType}" block called "${blockName || 'their block'}" for Renaissance City, a community platform in Detroit.

Your job is to:
1. Extract and organize the answers from their spoken transcript
2. Create a clear, structured document that captures their vision
3. Generate strategic follow-up questions that gather NEW information to shape the block's direction

Be encouraging and constructive. If answers are vague or missing, note what could be clarified but don't be critical.`;

    userPrompt = `Here are the ORIGINAL questions they were asked:
${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Here is their transcript (spoken answers):
"""
${transcript}
"""

Please analyze this and return a JSON object with:
1. "answers" - an array of objects, each with:
   - "question": the original question
   - "answer": their answer extracted from the transcript (or "Not addressed" if they didn't answer)
   - "keyPoints": array of 1-3 key takeaways from their answer

2. "summary" - an object with:
   - "name": suggested block name (use "${blockName}" if provided, or suggest one)
   - "tagline": a short, catchy tagline for the block (under 10 words)
   - "description": a 2-3 sentence description of what this block will be
   - "targetAudience": who this block is for
   - "coreFeatures": array of 3-5 core features or capabilities
   - "nextSteps": array of 2-3 recommended next steps to build this

3. "followUpQuestions" - an array of 4-6 follow-up questions to clarify direction, each with:
   - "id": a unique identifier like "q1", "q2", etc.
   - "question": the clarifying question (be specific and actionable)
   - "context": brief explanation of why this matters for building their block
   - "type": one of "single" (pick one), "multi" (pick multiple), or "open" (free text)
   - "options": array of 2-5 suggested answers (REQUIRED for "single" and "multi" types, omit for "open")

CRITICAL GUIDELINES FOR FOLLOW-UP QUESTIONS:

Question Type Distribution (MUST follow):
- At least 2-3 questions MUST be "single" type (pick one from options) - use for key decisions like monetization model, primary platform, launch approach, user authentication method, etc.
- At least 1-2 questions MUST be "multi" type (pick multiple) - use for features to prioritize, target demographics, integration needs, etc.
- Maximum 1 question can be "open" type - only use when truly custom input is needed (specific pricing, unique workflow details, etc.)

DO NOT generate follow-up questions that:
- Repeat or closely resemble the original questions listed above
- Ask for information the user already clearly provided in their answers
- Are too similar to each other (each question should explore a DISTINCT aspect)
- Don't contribute meaningful new information for building the block

DO generate follow-up questions that:
- Explore GAPS in their answers (things they didn't address or were vague about)
- Force specific decisions needed to actually build this ${blockType} (tech stack, monetization, launch strategy, user management, etc.)
- Help prioritize between competing directions they mentioned
- Clarify scale/scope decisions (MVP vs full product, local vs regional, etc.)

Good examples of decision-forcing questions:
- "How should users pay?" with options ["Free", "One-time purchase", "Subscription", "Freemium", "Pay what you want"]
- "What's your launch priority?" with options ["Get it live fast (MVP)", "Make it polished first", "Beta test with small group"]
- "Which features are must-haves for launch?" (multi) with specific feature options based on what they described

Return ONLY valid JSON, no markdown or explanation.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let parsed;
    try {
      // Remove any markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('Failed to parse AI response');
    }

    return res.status(200).json({
      success: true,
      answers: parsed.answers,
      summary: parsed.summary,
      followUpQuestions: parsed.followUpQuestions,
      prd: parsed.prd,
    });

  } catch (error) {
    console.error('Error processing answers:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process answers',
    });
  }
}
