import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";

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

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  width: 100%;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.accent};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Title = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Spacer = styled.div`
  width: 80px;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: 0 4px 20px ${({ theme }) => theme.shadow};
  overflow: hidden;
`;

const FormSection = styled.div`
  padding: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem 0;
`;

const ProfilePictureContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const AvatarWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid ${({ theme }) => theme.accentGold};
  background: ${({ theme }) => theme.backgroundAlt};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px ${({ theme }) => theme.shadow};
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.accent} 0%,
    ${({ theme }) => theme.accentGold} 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
  font-family: 'Cormorant Garamond', Georgia, serif;
`;

const EditOverlay = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent};
  border: 2px solid ${({ theme }) => theme.surface};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};

  &:hover {
    background: ${({ theme }) => theme.accentGold};
    transform: scale(1.1);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ImageActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const SmallButton = styled.button<{ $variant?: 'danger' }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme, $variant }) => $variant === 'danger' ? '#c53030' : theme.textSecondary};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme, $variant }) => $variant === 'danger' ? '#e53e3e' : theme.accent};
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accent}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    opacity: 0.6;
  }
`;

const HelpText = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  font-style: italic;
`;

const ButtonContainer = styled.div`
  padding: 1.5rem 2rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  background: ${({ theme }) => theme.backgroundAlt};
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.75rem 1.5rem;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ $primary, theme }) =>
    $primary
      ? `
        background: linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentGold} 100%);
        color: white;
        border: none;
        box-shadow: 0 2px 8px ${theme.shadow};

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${theme.shadow};
        }
      `
      : `
        background: transparent;
        color: ${theme.textSecondary};
        border: 1px solid ${theme.border};

        &:hover:not(:disabled) {
          border-color: ${theme.accent};
          color: ${theme.accent};
        }
      `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: 1rem;
  margin: 0 2rem 1rem;
  border-radius: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  animation: ${fadeIn} 0.3s ease-out;

  ${({ $type, theme }) =>
    $type === 'success'
      ? `
        background: ${theme.accent}15;
        color: ${theme.accent};
        border: 1px solid ${theme.accent}30;
      `
      : `
        background: #c5303015;
        color: #c53030;
        border: 1px solid #c5303030;
      `}
`;

const AccountPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading, setUser, refreshUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageError, setImageError] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPreviewUrl(user.pfpUrl || null);
    }
  }, [user]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading) {
    return <Loading text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  const initials = (displayName || user.username || `User ${user.fid}`)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewImageBase64(base64);
      setPreviewUrl(base64);
      setRemoveImage(false);
      setImageError(false);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setNewImageBase64(null);
    setPreviewUrl(null);
    setRemoveImage(true);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setDisplayName(user.displayName || '');
    setPreviewUrl(user.pfpUrl || null);
    setNewImageBase64(null);
    setRemoveImage(false);
    setMessage(null);
    setImageError(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const updatePayload: {
        displayName?: string | null;
        profilePicture?: string | null;
      } = {};

      // Only include displayName if it changed
      if (displayName !== (user.displayName || '')) {
        updatePayload.displayName = displayName || null;
      }

      // Handle profile picture changes
      if (newImageBase64) {
        updatePayload.profilePicture = newImageBase64;
      } else if (removeImage) {
        updatePayload.profilePicture = null;
      }

      // Don't make a request if nothing changed
      if (Object.keys(updatePayload).length === 0) {
        setMessage({ type: 'success', text: 'No changes to save' });
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local user state
      if (data.user) {
        setUser(data.user);
        setPreviewUrl(data.user.pfpUrl || null);
        setNewImageBase64(null);
        setRemoveImage(false);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Refresh user data
      await refreshUser();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    displayName !== (user.displayName || '') ||
    newImageBase64 !== null ||
    removeImage;

  return (
    <Container>
      <Head>
        <title>Account Settings | {APP_NAME}</title>
        <meta name="description" content="Manage your account settings" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header>
        <BackButton onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </BackButton>
        <Title>Account</Title>
        <Spacer />
      </Header>

      <Main>
        <FormCard>
          {message && (
            <Message $type={message.type}>{message.text}</Message>
          )}

          <FormSection>
            <SectionTitle>Profile Picture</SectionTitle>
            <ProfilePictureContainer>
              <AvatarWrapper>
                <Avatar>
                  {previewUrl && !imageError ? (
                    <AvatarImage
                      src={previewUrl}
                      alt="Profile"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <DefaultAvatar>{initials}</DefaultAvatar>
                  )}
                </Avatar>
                <EditOverlay onClick={() => fileInputRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </EditOverlay>
              </AvatarWrapper>
              <HiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <ImageActions>
                <SmallButton onClick={() => fileInputRef.current?.click()}>
                  Upload new
                </SmallButton>
                {(previewUrl || user.pfpUrl) && (
                  <SmallButton $variant="danger" onClick={handleRemoveImage}>
                    Remove
                  </SmallButton>
                )}
              </ImageActions>
              <HelpText>Recommended: Square image, at least 200×200 pixels</HelpText>
            </ProfilePictureContainer>
          </FormSection>

          <FormSection>
            <SectionTitle>Display Name</SectionTitle>
            <InputGroup>
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={50}
              />
              <HelpText>This is how your name will appear across Renaissance City</HelpText>
            </InputGroup>
          </FormSection>

          <ButtonContainer>
            <Button onClick={handleCancel} disabled={isSaving || !hasChanges}>
              Cancel
            </Button>
            <Button $primary onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </ButtonContainer>
        </FormCard>
      </Main>
    </Container>
  );
};

export default AccountPage;
