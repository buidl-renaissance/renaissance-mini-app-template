import { useState, useEffect, useCallback } from 'react';

const DRAFT_STORAGE_KEY = 'renaissance-block-draft';

// All possible stages in the block creation flow
export type DraftStage = 
  | 'naming'           // /get-started - naming the block
  | 'type-selection'   // /get-started - selecting block type
  | 'questions'        // /onboarding/[type] - answering questions
  | 'processing'       // /onboarding/[type] - AI processing (transient)
  | 'followup'         // /onboarding/[type] - follow-up questions
  | 'followup-processing' // /onboarding/[type] - processing follow-ups (transient)
  | 'document'         // /onboarding/[type] - reviewing PRD
  | 'details'          // /app-blocks/new - block details
  | 'connectors'       // /app-blocks/new - selecting connectors
  | 'blocks'           // /app-blocks/new - selecting other blocks
  | 'recipes'          // /app-blocks/new - selecting recipes
  | 'review';          // /app-blocks/new - final review

export interface ProcessedAnswer {
  question: string;
  answer: string;
  keyPoints: string[];
}

export interface BlockSummary {
  name: string;
  tagline: string;
  description: string;
  targetAudience: string;
  coreFeatures: string[];
  nextSteps: string[];
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  context: string;
  type: 'single' | 'multi' | 'open';
  options?: string[];
}

export interface FollowUpAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
  skipped: boolean;
}

export interface ProductRequirementsDocument {
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

export interface SelectedBlock {
  entryId: string;
  displayName: string;
  slug: string;
  scopes: string[];
}

export interface BlockDraft {
  // Core identifiers
  id: string;
  createdAt: string;
  lastUpdated: string;
  currentStage: DraftStage;
  
  // Get Started data
  blockName: string;
  blockType: string | null;
  
  // Onboarding data
  transcript: string;
  processedAnswers: ProcessedAnswer[];
  summary: BlockSummary | null;
  followUpQuestions: FollowUpQuestion[];
  followUpAnswers: Record<string, FollowUpAnswer>;
  prd: ProductRequirementsDocument | null;
  
  // App Block creation data
  description: string;
  selectedConnectors: string[];
  selectedRecipes: Record<string, string | 'custom'>;
  selectedBlocks: SelectedBlock[];
}

const createEmptyDraft = (): BlockDraft => ({
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  currentStage: 'naming',
  
  blockName: '',
  blockType: null,
  
  transcript: '',
  processedAnswers: [],
  summary: null,
  followUpQuestions: [],
  followUpAnswers: {},
  prd: null,
  
  description: '',
  selectedConnectors: [],
  selectedRecipes: {},
  selectedBlocks: [],
});

export function useBlockDraft() {
  const [draft, setDraft] = useState<BlockDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsedDraft: BlockDraft = JSON.parse(saved);
        setDraft(parsedDraft);
        // Check if there's meaningful progress
        const hasProgress = parsedDraft.blockName || 
          parsedDraft.blockType || 
          parsedDraft.transcript || 
          parsedDraft.processedAnswers.length > 0 ||
          parsedDraft.selectedConnectors.length > 0;
        setHasDraft(hasProgress);
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback((updates: Partial<BlockDraft>) => {
    setDraft(prev => {
      const currentDraft = prev || createEmptyDraft();
      const newDraft: BlockDraft = {
        ...currentDraft,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newDraft));
      } catch (e) {
        console.error('Error saving draft:', e);
      }
      
      setHasDraft(true);
      return newDraft;
    });
  }, []);

  // Update specific fields
  const updateDraft = useCallback((updates: Partial<BlockDraft>) => {
    saveDraft(updates);
  }, [saveDraft]);

  // Start a new draft (clears existing)
  const startNewDraft = useCallback(() => {
    const newDraft = createEmptyDraft();
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newDraft));
    } catch (e) {
      console.error('Error creating new draft:', e);
    }
    setDraft(newDraft);
    setHasDraft(false);
    return newDraft;
  }, []);

  // Resume existing draft
  const resumeDraft = useCallback(() => {
    // Draft is already loaded, just return it
    return draft;
  }, [draft]);

  // Clear the draft entirely
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
    setDraft(null);
    setHasDraft(false);
  }, []);

  // Get a human-readable description of draft progress
  const getDraftProgress = useCallback((): { stage: string; description: string } | null => {
    if (!draft) return null;
    
    switch (draft.currentStage) {
      case 'naming':
        return { stage: 'Get Started', description: 'Naming your block' };
      case 'type-selection':
        return { stage: 'Get Started', description: `Named "${draft.blockName}" - choosing type` };
      case 'questions':
        return { stage: 'Onboarding', description: 'Answering questions' };
      case 'processing':
        return { stage: 'Onboarding', description: 'Processing answers' };
      case 'followup':
        return { stage: 'Onboarding', description: 'Answering follow-up questions' };
      case 'followup-processing':
        return { stage: 'Onboarding', description: 'Processing follow-ups' };
      case 'document':
        return { stage: 'Onboarding', description: 'Reviewing blueprint' };
      case 'details':
        return { stage: 'Create Block', description: 'Entering details' };
      case 'connectors':
        return { stage: 'Create Block', description: 'Selecting connectors' };
      case 'blocks':
        return { stage: 'Create Block', description: 'Connecting other blocks' };
      case 'recipes':
        return { stage: 'Create Block', description: 'Selecting recipes' };
      case 'review':
        return { stage: 'Create Block', description: 'Final review' };
      default:
        return null;
    }
  }, [draft]);

  // Get the route to resume from
  const getResumeRoute = useCallback((): string => {
    if (!draft) return '/get-started';
    
    switch (draft.currentStage) {
      case 'naming':
      case 'type-selection':
        return '/get-started';
      case 'questions':
      case 'processing':
      case 'followup':
      case 'followup-processing':
      case 'document':
        return draft.blockType 
          ? `/onboarding/${draft.blockType}?name=${encodeURIComponent(draft.blockName)}`
          : '/get-started';
      case 'details':
      case 'connectors':
      case 'blocks':
      case 'recipes':
      case 'review':
        return '/app-blocks/new';
      default:
        return '/get-started';
    }
  }, [draft]);

  return {
    draft,
    isLoaded,
    hasDraft,
    updateDraft,
    startNewDraft,
    resumeDraft,
    clearDraft,
    getDraftProgress,
    getResumeRoute,
  };
}

export default useBlockDraft;
