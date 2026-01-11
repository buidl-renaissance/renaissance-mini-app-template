import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { User } from '@/db/user';
import { getOrCreateWallet } from '@/lib/embeddedWallet';

interface OTPVerificationProps {
  phone: string;
  isNewAccount: boolean;
  userData?: {
    username: string;
    name: string;
    email?: string;
  };
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const CodeInputContainer = styled.div<{ $hasError?: boolean }>`
  display: flex;
  gap: 0.5rem;
  animation: ${({ $hasError }) => $hasError ? shake : 'none'} 0.5s ease-in-out;
`;

const CodeInput = styled.input<{ $filled?: boolean; $hasError?: boolean }>`
  width: 48px;
  height: 56px;
  text-align: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  background: ${({ theme, $filled }) => $filled ? theme.backgroundAlt : theme.background};
  border: 2px solid ${({ theme, $hasError, $filled }) => 
    $hasError ? theme.accent : $filled ? theme.accentGold : theme.border};
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentGold};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.accentGold}20`};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.border};
  }

  /* Hide spinner for number inputs */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;

const ErrorText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.accent};
  text-align: center;
  margin: 0;
`;

const ResendContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const ResendText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
`;

const ResendButton = styled.button<{ $disabled?: boolean }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme, $disabled }) => $disabled ? theme.textSecondary : theme.accent};
  background: none;
  border: none;
  cursor: ${({ $disabled }) => $disabled ? 'default' : 'pointer'};
  text-decoration: ${({ $disabled }) => $disabled ? 'none' : 'underline'};
  transition: color 0.2s ease;
  
  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.accentGold};
  }
`;

const BackButton = styled.button`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => `${theme.surface}ee`};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accentGold};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const VerifyingContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

const OTPVerification: React.FC<OTPVerificationProps> = ({
  phone,
  isNewAccount,
  userData,
  onSuccess,
  onBack,
}) => {
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-submit when code is complete
  const verifyCode = useCallback(async (fullCode: string) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      // Generate or retrieve embedded wallet for the user
      const { address: publicAddress, isNew: isNewWallet } = getOrCreateWallet();
      
      if (isNewWallet) {
        console.log('🔐 Generated new embedded wallet:', publicAddress);
      } else {
        console.log('🔐 Using existing embedded wallet:', publicAddress);
      }
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: fullCode,
          isNewAccount,
          userData,
          publicAddress,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        setCode(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }
      
      // Success!
      onSuccess(data.user);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Something went wrong. Please try again.');
      setCode(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [phone, isNewAccount, userData, onSuccess]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);
    
    // Move to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Check if complete
    const fullCode = newCode.join('');
    if (fullCode.length === OTP_LENGTH) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      
      // Focus the next empty input or last input
      const nextEmptyIndex = newCode.findIndex((c) => !c);
      inputRefs.current[nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex]?.focus();
      
      // Auto-submit if complete
      if (pastedData.length === OTP_LENGTH) {
        verifyCode(pastedData);
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to resend code');
        return;
      }
      
      setResendCooldown(RESEND_COOLDOWN);
      setCode(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend code. Please try again.');
    }
  };

  const formatPhone = (p: string) => {
    if (p.length === 10) {
      return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`;
    }
    return p;
  };

  return (
    <Container>
      <BackButton onClick={onBack}>
        ← Change phone number
      </BackButton>
      
      {isVerifying ? (
        <VerifyingContainer>
          <LoadingOverlay>
            <Spinner />
          </LoadingOverlay>
        </VerifyingContainer>
      ) : (
        <>
          <CodeInputContainer $hasError={!!error} onPaste={handlePaste}>
            {code.map((digit, index) => (
              <CodeInput
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                $filled={!!digit}
                $hasError={!!error}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </CodeInputContainer>
          
          {error && <ErrorText>{error}</ErrorText>}
          
          <ResendContainer>
            <ResendText>
              Didn&apos;t receive the code?
            </ResendText>
            <ResendButton
              onClick={handleResend}
              $disabled={resendCooldown > 0}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : 'Resend Code'
              }
            </ResendButton>
          </ResendContainer>
          
          <ResendText>
            Code sent to {formatPhone(phone)}
          </ResendText>
        </>
      )}
    </Container>
  );
};

export default OTPVerification;
