import React from "react";
import styled, { keyframes } from "styled-components";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Modal = ({ isOpen, onClose, children, title }: ModalProps) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        {title && (
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            <CloseButton onClick={onClose}>×</CloseButton>
          </ModalHeader>
        )}
        {!title && (
          <CloseButtonFloating onClick={onClose}>×</CloseButtonFloating>
        )}
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px ${({ theme }) => theme.shadow};
  animation: ${slideUp} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const ModalTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const CloseButtonFloating = styled(CloseButton)`
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  z-index: 1;
`;

export const ModalBody = styled.div`
  padding: 1.5rem;
`;

export const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

export const ModalButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.7rem 1.25rem;
  border-radius: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant = 'secondary', theme }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentGold} 150%);
    color: white;
    border: none;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${theme.accent}44;
    }
  ` : `
    background: ${theme.background};
    color: ${theme.textSecondary};
    border: 1px solid ${theme.border};
    
    &:hover {
      background: ${theme.surface};
      color: ${theme.text};
    }
  `}
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    font-style: italic;
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accent}22;
  }
`;
