import React from "react";
import styled, { keyframes } from "styled-components";
import { Template, defaultTemplates } from "@/data/template";
import router from "next/router";

interface TemplatesProps {
  templates?: Template[];
}

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Templates: React.FC<TemplatesProps> = ({
  templates = defaultTemplates,
}) => {
  return (
    <TemplatesSection>
      <SectionHeader>What are you building?</SectionHeader>
      <SectionSubtext>
        Choose a starting point to help guide your thinking
      </SectionSubtext>
      <TemplateGrid>
        {templates.map((template, index) => (
          <TemplateCard
            key={template.id}
            onClick={() => router.push(`/create/${template.id}`)}
            $delay={index * 0.08}
          >
            <TemplateTag>{template.tag}</TemplateTag>
            <TemplateTitle>{template.name}</TemplateTitle>
            <TemplateDescription>
              {template.description || `Start a ${template.name.toLowerCase()} project`}
            </TemplateDescription>
            <ArrowIcon>→</ArrowIcon>
          </TemplateCard>
        ))}
      </TemplateGrid>
    </TemplatesSection>
  );
};

export default Templates;

const TemplatesSection = styled.section`
  width: 100%;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SectionHeader = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.text};
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const SectionSubtext = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 2rem 0;
  text-align: center;
  font-style: italic;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 900px;
  
  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
`;

const ArrowIcon = styled.span`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.accent};
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
`;

const TemplateCard = styled.div<{ $delay: number }>`
  position: relative;
  padding: 1.5rem;
  padding-bottom: 2.5rem;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
  transition: all 0.25s ease;
  cursor: pointer;
  animation: ${fadeInUp} 0.5s ease-out ${({ $delay }) => $delay}s both;
  min-height: 160px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px ${({ theme }) => theme.shadow};
    border-color: ${({ theme }) => theme.accent};
    
    ${ArrowIcon} {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const TemplateTag = styled.span`
  display: inline-block;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.accent}22 0%,
    ${({ theme }) => theme.accentGold}22 100%
  );
  color: ${({ theme }) => theme.accent};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Crimson Pro', Georgia, serif;
  border: 1px solid ${({ theme }) => theme.accent}33;
`;

const TemplateTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  margin: 0 0 0.5rem 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;
`;

const TemplateDescription = styled.p`
  margin: 0;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.textSecondary};
`;
