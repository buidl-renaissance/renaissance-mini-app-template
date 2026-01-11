import React, { useState } from 'react';
import styled from 'styled-components';

interface SignInFormProps {
  onSubmit: (phone: string) => void;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.875rem 1rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme, $hasError }) => $hasError ? theme.accent : theme.border};
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    opacity: 0.6;
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) => $hasError ? theme.accent : theme.accentGold};
    box-shadow: 0 0 0 3px ${({ theme, $hasError }) => 
      $hasError ? `${theme.accent}20` : `${theme.accentGold}20`};
  }
`;

const ErrorText = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.accent};
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  margin-top: 0.5rem;
  padding: 1rem 1.5rem;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.accent} 0%,
    ${({ theme }) => theme.accentGold} 100%
  );
  border: none;
  border-radius: 8px;
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px ${({ theme }) => theme.shadow};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GeneralError = styled.div`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => `${theme.accent}10`};
  border: 1px solid ${({ theme }) => `${theme.accent}30`};
  border-radius: 8px;
  color: ${({ theme }) => theme.accent};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  text-align: center;
`;

const HelpText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin-top: 0.5rem;
`;

// Phone number formatting
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

const SignInForm: React.FC<SignInFormProps> = ({ onSubmit }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const phoneDigits = unformatPhoneNumber(phone);
    
    if (!phoneDigits) {
      setError('Phone number is required');
      return;
    }
    
    if (phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API to send OTP
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneDigits }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }
      
      // Success - proceed to OTP verification
      onSubmit(phoneDigits);
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <GeneralError>{error}</GeneralError>}
      
      <InputGroup>
        <Label htmlFor="signin-phone">Phone Number</Label>
        <Input
          id="signin-phone"
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(555) 123-4567"
          $hasError={!!error}
          autoComplete="tel"
          autoFocus
        />
        {error && <ErrorText>{error}</ErrorText>}
      </InputGroup>
      
      <SubmitButton type="submit" disabled={isLoading} $loading={isLoading}>
        {isLoading ? 'Sending Code...' : 'Send Verification Code'}
      </SubmitButton>
      
      <HelpText>
        We&apos;ll send a verification code to your phone
      </HelpText>
    </Form>
  );
};

export default SignInForm;
