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
  question: string;
  context: string;
  options?: string[];
}

interface ProcessAnswersResponse {
  success: boolean;
  answers?: ProcessedAnswer[];
  summary?: BlockSummary;
  followUpQuestions?: FollowUpQuestion[];
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
    // Follow-up processing - refine the summary with new details
    systemPrompt = `You are helping someone build a "${blockType}" block called "${blockName || 'their block'}" for Renaissance City, a community platform in Detroit.

They've already answered initial questions, and now they're providing additional clarifying details. Your job is to:
1. Extract answers from their follow-up responses
2. Create a refined, more detailed summary that incorporates all the new information

Be encouraging and constructive.`;

    userPrompt = `Here is their previous summary:
${JSON.stringify(previousSummary, null, 2)}

Here are their previous answers:
${previousAnswers.map((a: ProcessedAnswer) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}

Here are the follow-up questions they were asked:
${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Here is their follow-up transcript (spoken answers):
"""
${transcript}
"""

Please analyze this and return a JSON object with:
1. "answers" - an array of objects for the NEW follow-up questions, each with:
   - "question": the follow-up question
   - "answer": their answer extracted from the transcript (or "Not addressed" if they didn't answer)
   - "keyPoints": array of 1-3 key takeaways from their answer

2. "summary" - an UPDATED object that refines and enhances the previous summary with the new details:
   - "name": the block name (keep "${previousSummary.name}" unless they specifically wanted to change it)
   - "tagline": refined tagline based on new clarity
   - "description": more detailed 2-3 sentence description incorporating new information
   - "targetAudience": refined audience description
   - "coreFeatures": array of 3-5 core features (updated with more specific details)
   - "nextSteps": array of 2-3 concrete next steps to build this

Return ONLY valid JSON, no markdown or explanation.`;

  } else {
    // Initial processing
    systemPrompt = `You are helping someone build a "${blockType}" block called "${blockName || 'their block'}" for Renaissance City, a community platform in Detroit.

Your job is to:
1. Extract and organize the answers from their spoken transcript
2. Create a clear, structured document that captures their vision

Be encouraging and constructive. If answers are vague or missing, note what could be clarified but don't be critical.`;

    userPrompt = `Here are the questions they were asked:
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

3. "followUpQuestions" - an array of 3-5 follow-up questions to clarify direction, each with:
   - "question": the clarifying question (be specific and actionable)
   - "context": brief explanation of why this matters for building their block
   - "options": optional array of 2-4 suggested answers/directions they could take

The follow-up questions should:
- Dig deeper into vague or incomplete answers
- Help clarify specific decisions needed for a ${blockType}
- Focus on practical details needed to actually build this (monetization, tech choices, launch strategy, etc.)
- Be tailored to what they shared — don't ask about things they already answered clearly

Return ONLY valid JSON, no markdown or explanation.`;
  }

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
    });

  } catch (error) {
    console.error('Error processing answers:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process answers',
    });
  }
}
