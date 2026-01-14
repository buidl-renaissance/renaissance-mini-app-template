import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import VoiceTranscriber from "@/components/VoiceTranscriber";
import { blockTypeQuestions, BlockTypeConfig } from "@/data/template";

const APP_NAME = "Renaissance City";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.background};
  z-index: 10;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const BlockTypeLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
`;

const Main = styled.main`
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 1.5rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const pulseGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 15px rgba(167, 139, 250, 0.4)) drop-shadow(0 0 30px rgba(232, 121, 249, 0.2));
  }
  50% {
    filter: drop-shadow(0 0 25px rgba(167, 139, 250, 0.6)) drop-shadow(0 0 50px rgba(232, 121, 249, 0.4));
  }
`;

const BlockImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: contain;
  animation: ${pulseGlow} 3s ease-in-out infinite;
  margin-bottom: 0.5rem;
`;

const Title = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem 0;
`;

const Subtitle = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 auto;
  max-width: 450px;
  line-height: 1.5;
`;

const QuestionsCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 1.25rem;
  animation: ${fadeIn} 0.4s ease-out 0.1s both;
`;

const QuestionsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const QuestionItem = styled.div<{ $index: number }>`
  display: flex;
  gap: 0.75rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  animation: ${fadeIn} 0.3s ease-out ${({ $index }) => $index * 0.03}s both;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &:first-child {
    padding-top: 0;
  }
`;

const QuestionNumber = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent}15;
  color: ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
`;

const QuestionText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  margin: 0;
  line-height: 1.4;
`;

const Divider = styled.div`
  width: 50px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    ${({ theme }) => theme.accentGold},
    transparent
  );
  margin: 1.25rem auto;
`;

const RecordSection = styled.div`
  text-align: center;
  animation: ${fadeIn} 0.4s ease-out 0.2s both;
`;

const RecordTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem 0;
`;

const RecordSubtitle = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1.25rem 0;
`;

const ProcessingSection = styled.div`
  text-align: center;
  padding: 2rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 auto 1rem;
`;

const ProcessingText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
`;

// Document Display Styles
const DocumentCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
`;

const DocumentHeader = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}15 0%, ${({ theme }) => theme.accentGold}15 100%);
  padding: 1.25rem;
  text-align: center;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const DocumentTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem 0;
`;

const DocumentTagline = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.accent};
  font-style: italic;
  margin: 0;
`;

const DocumentBody = styled.div`
  padding: 1.25rem;
`;

const Section = styled.div`
  margin-bottom: 1.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.5rem 0;
`;

const SectionContent = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.5;
  margin: 0;
`;

const FeatureList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.4;
  
  &::before {
    content: '✦';
    color: ${({ theme }) => theme.accent};
    flex-shrink: 0;
    font-size: 0.75rem;
  }
`;

const AnswerCard = styled.div`
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const AnswerQuestion = styled.div`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.375rem;
`;

const AnswerText = styled.div`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.4;
`;

const KeyPoints = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const KeyPoint = styled.span`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  background: ${({ theme }) => theme.accent}15;
  color: ${({ theme }) => theme.accent};
  border-radius: 100px;
`;

const NextStepsList = styled.ol`
  margin: 0;
  padding: 0 0 0 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const NextStepItem = styled.li`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.4;
  
  &::marker {
    color: ${({ theme }) => theme.accent};
    font-weight: 600;
  }
`;

const FollowUpCard = styled.div<{ $index: number }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  animation: ${fadeIn} 0.3s ease-out ${({ $index }) => $index * 0.05}s both;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FollowUpQuestion = styled.div`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
  line-height: 1.4;
`;

const FollowUpContext = styled.div`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.75rem;
  line-height: 1.4;
`;

const OptionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const OptionChip = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  padding: 0.375rem 0.75rem;
  background: ${({ theme }) => theme.accent}10;
  border: 1px solid ${({ theme }) => theme.accent}30;
  color: ${({ theme }) => theme.text};
  border-radius: 100px;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $primary, theme }) => $primary ? `
    background: linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentGold} 150%);
    border: none;
    color: white;
    box-shadow: 0 4px 16px ${theme.accent}44;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px ${theme.accent}55;
    }
  ` : `
    background: transparent;
    border: 1px solid ${theme.border};
    color: ${theme.textSecondary};
    
    &:hover:not(:disabled) {
      border-color: ${theme.text};
      color: ${theme.text};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 10px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  margin-top: 1rem;
  text-align: center;
`;

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

type ViewState = 'questions' | 'processing' | 'followup' | 'document';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { type, name } = router.query;
  const { user, isLoading: isUserLoading } = useUser();
  
  const [viewState, setViewState] = useState<ViewState>('questions');
  const [transcript, setTranscript] = useState('');
  const [processedAnswers, setProcessedAnswers] = useState<ProcessedAnswer[]>([]);
  const [summary, setSummary] = useState<BlockSummary | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [followUpTranscript, setFollowUpTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const blockType = type as string;
  const blockName = name as string;
  const config: BlockTypeConfig | undefined = blockTypeQuestions[blockType];

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (type && !blockTypeQuestions[type as string]) {
      router.push('/get-started');
    }
  }, [type, router]);

  if (isUserLoading || !config) {
    return <Loading text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  const questions = config.questions;

  const processTranscript = async (transcriptText: string, isFollowUp = false) => {
    setViewState('processing');
    setError(null);
    
    try {
      const response = await fetch('/api/process-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          questions: isFollowUp ? followUpQuestions.map(q => q.question) : questions,
          blockType: config.name,
          blockName,
          isFollowUp,
          previousAnswers: isFollowUp ? processedAnswers : undefined,
          previousSummary: isFollowUp ? summary : undefined,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process answers');
      }

      if (isFollowUp) {
        // Merge follow-up answers with previous answers
        const newAnswers = data.answers || [];
        setProcessedAnswers(prev => [...prev, ...newAnswers]);
        setSummary(data.summary || summary);
        setFollowUpQuestions([]);
        setViewState('document');
      } else {
        setProcessedAnswers(data.answers || []);
        setSummary(data.summary || null);
        
        // If there are follow-up questions, show them
        if (data.followUpQuestions && data.followUpQuestions.length > 0) {
          setFollowUpQuestions(data.followUpQuestions);
          setViewState('followup');
        } else {
          setViewState('document');
        }
      }
    } catch (err) {
      console.error('Error processing transcript:', err);
      setError(err instanceof Error ? err.message : 'Failed to process answers');
      setViewState(isFollowUp ? 'followup' : 'questions');
    }
  };

  const handleVoiceTranscript = (newTranscript: string) => {
    const fullTranscript = transcript ? `${transcript}\n\n${newTranscript}` : newTranscript;
    setTranscript(fullTranscript);
    processTranscript(fullTranscript, false);
  };

  const handleFollowUpTranscript = (newTranscript: string) => {
    const fullTranscript = followUpTranscript ? `${followUpTranscript}\n\n${newTranscript}` : newTranscript;
    setFollowUpTranscript(fullTranscript);
    processTranscript(fullTranscript, true);
  };

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (summary?.name) params.set('name', summary.name);
    params.set('type', blockType);
    if (summary) {
      params.set('summary', JSON.stringify(summary));
    }
    if (processedAnswers.length > 0) {
      params.set('answers', JSON.stringify(processedAnswers));
    }
    
    router.push(`/app-blocks/new?${params.toString()}`);
  };

  const handleReRecord = () => {
    setTranscript('');
    setProcessedAnswers([]);
    setSummary(null);
    setViewState('questions');
  };

  return (
    <Container>
      <Head>
        <title>Shape Your {config.name} | {APP_NAME}</title>
        <meta name="description" content={`Define your ${config.name} for Renaissance City`} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header>
        <BackLink href="/get-started">
          ← Back
        </BackLink>
        <BlockTypeLabel>
          <span>{config.icon}</span>
          {config.name}
        </BlockTypeLabel>
      </Header>

      <Main>
        {viewState === 'questions' && (
          <>
            <HeroSection>
              <BlockImage src="/app-block.png" alt="Your Block" />
              {blockName && <Title>{blockName}</Title>}
              <Subtitle>
                Think through these questions, then record your answers.
              </Subtitle>
            </HeroSection>

            <QuestionsCard>
              <QuestionsList>
                {questions.map((question, idx) => (
                  <QuestionItem key={idx} $index={idx}>
                    <QuestionNumber>{idx + 1}</QuestionNumber>
                    <QuestionText>{question}</QuestionText>
                  </QuestionItem>
                ))}
              </QuestionsList>

              <Divider />

              <RecordSection>
                <RecordTitle>Ready?</RecordTitle>
                <RecordSubtitle>
                  Talk through your answers naturally.
                </RecordSubtitle>
                <VoiceTranscriber
                  onTranscriptReady={handleVoiceTranscript}
                  placeholder="Your spoken answers will appear here..."
                  variant="circular"
                />
                {error && <ErrorMessage>{error}</ErrorMessage>}
              </RecordSection>
            </QuestionsCard>
          </>
        )}

        {viewState === 'processing' && (
          <ProcessingSection>
            <Spinner />
            <ProcessingText>Processing your answers...</ProcessingText>
          </ProcessingSection>
        )}

        {viewState === 'followup' && (
          <>
            <HeroSection>
              <BlockImage src="/app-block.png" alt="Your Block" />
              <Title>A Few More Details</Title>
              <Subtitle>
                Based on your answers, we have a few follow-up questions to clarify the direction.
              </Subtitle>
            </HeroSection>

            <QuestionsCard>
              {followUpQuestions.map((fq, idx) => (
                <FollowUpCard key={idx} $index={idx}>
                  <FollowUpQuestion>{fq.question}</FollowUpQuestion>
                  <FollowUpContext>{fq.context}</FollowUpContext>
                  {fq.options && fq.options.length > 0 && (
                    <OptionsRow>
                      {fq.options.map((opt, oidx) => (
                        <OptionChip key={oidx}>{opt}</OptionChip>
                      ))}
                    </OptionsRow>
                  )}
                </FollowUpCard>
              ))}

              <Divider />

              <RecordSection>
                <RecordTitle>Continue</RecordTitle>
                <RecordSubtitle>
                  Answer these follow-ups to refine your block.
                </RecordSubtitle>
                <VoiceTranscriber
                  onTranscriptReady={handleFollowUpTranscript}
                  placeholder="Your spoken answers will appear here..."
                  variant="circular"
                />
                {error && <ErrorMessage>{error}</ErrorMessage>}
              </RecordSection>
            </QuestionsCard>
          </>
        )}

        {viewState === 'document' && summary && (
          <>
            <HeroSection>
              <Title>Your Block Blueprint</Title>
              <Subtitle>
                Review what we captured, then create your block.
              </Subtitle>
            </HeroSection>

            <DocumentCard>
              <DocumentHeader>
                <DocumentTitle>{summary.name}</DocumentTitle>
                <DocumentTagline>{summary.tagline}</DocumentTagline>
              </DocumentHeader>

              <DocumentBody>
                <Section>
                  <SectionTitle>About</SectionTitle>
                  <SectionContent>{summary.description}</SectionContent>
                </Section>

                <Section>
                  <SectionTitle>Audience</SectionTitle>
                  <SectionContent>{summary.targetAudience}</SectionContent>
                </Section>

                <Section>
                  <SectionTitle>Core Features</SectionTitle>
                  <FeatureList>
                    {summary.coreFeatures.map((feature, idx) => (
                      <FeatureItem key={idx}>{feature}</FeatureItem>
                    ))}
                  </FeatureList>
                </Section>

                <Divider />

                <Section>
                  <SectionTitle>Your Answers</SectionTitle>
                  {processedAnswers.map((answer, idx) => (
                    <AnswerCard key={idx}>
                      <AnswerQuestion>{answer.question}</AnswerQuestion>
                      <AnswerText>{answer.answer}</AnswerText>
                      {answer.keyPoints && answer.keyPoints.length > 0 && (
                        <KeyPoints>
                          {answer.keyPoints.map((point, pidx) => (
                            <KeyPoint key={pidx}>{point}</KeyPoint>
                          ))}
                        </KeyPoints>
                      )}
                    </AnswerCard>
                  ))}
                </Section>

                <Section>
                  <SectionTitle>Next Steps</SectionTitle>
                  <NextStepsList>
                    {summary.nextSteps.map((step, idx) => (
                      <NextStepItem key={idx}>{step}</NextStepItem>
                    ))}
                  </NextStepsList>
                </Section>

                <ActionsRow>
                  <Button onClick={handleReRecord}>
                    Re-record
                  </Button>
                  <Button $primary onClick={handleContinue}>
                    Create Block →
                  </Button>
                </ActionsRow>
              </DocumentBody>
            </DocumentCard>
          </>
        )}
      </Main>
    </Container>
  );
};

export default OnboardingPage;
