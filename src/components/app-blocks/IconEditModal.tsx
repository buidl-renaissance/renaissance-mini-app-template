import React, { useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import Cropper, { Area } from 'react-easy-crop';

interface IconEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (iconUrl: string) => void;
  appBlockId: string;
  currentIconUrl?: string | null;
}

type TabType = 'upload' | 'generate';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
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

export const IconEditModal: React.FC<IconEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  appBlockId,
  currentIconUrl,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Generate state
  const [prompt, setPrompt] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImage = async (): Promise<string> => {
    if (!imageSrc || !croppedAreaPixels) {
      throw new Error('No image or crop area');
    }

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Set canvas to 300x300 for the final cropped image
    canvas.width = 300;
    canvas.height = 300;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      300,
      300
    );

    return canvas.toDataURL('image/png');
  };

  const handleUploadSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError('Please select and crop an image');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const croppedImage = await getCroppedImage();

      const response = await fetch(`/api/app-blocks/${appBlockId}/icon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'upload',
          image: croppedImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload icon');
      }

      onSave(data.iconUrl);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload icon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your icon');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPreview(null);

    try {
      const response = await fetch(`/api/app-blocks/${appBlockId}/icon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate',
          prompt: prompt.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate icon');
      }

      // Show preview and save
      setGeneratedPreview(data.iconUrl);
      onSave(data.iconUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate icon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setPrompt('');
    setGeneratedPreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit App Icon</ModalTitle>
          <CloseButton onClick={handleClose}>&times;</CloseButton>
        </ModalHeader>

        <TabContainer>
          <Tab
            $active={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
          >
            Upload Image
          </Tab>
          <Tab
            $active={activeTab === 'generate'}
            onClick={() => setActiveTab('generate')}
          >
            Generate with AI
          </Tab>
        </TabContainer>

        <ModalBody>
          {activeTab === 'upload' && (
            <UploadContent>
              {!imageSrc ? (
                <UploadArea>
                  <UploadLabel htmlFor="icon-upload">
                    {currentIconUrl ? (
                      <CurrentIconPreview src={currentIconUrl} alt="Current icon" />
                    ) : (
                      <UploadPlaceholder>
                        <UploadIcon>📷</UploadIcon>
                        <UploadText>Click to select an image</UploadText>
                        <UploadHint>PNG, JPG, or WebP</UploadHint>
                      </UploadPlaceholder>
                    )}
                  </UploadLabel>
                  <HiddenInput
                    id="icon-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                  />
                </UploadArea>
              ) : (
                <>
                  <CropContainer>
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      cropShape="rect"
                      showGrid={false}
                    />
                  </CropContainer>
                  <ZoomControl>
                    <ZoomLabel>Zoom</ZoomLabel>
                    <ZoomSlider
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </ZoomControl>
                  <ChangeImageButton
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                  >
                    Choose Different Image
                  </ChangeImageButton>
                </>
              )}
            </UploadContent>
          )}

          {activeTab === 'generate' && (
            <GenerateContent>
              <PromptLabel>Describe your app icon</PromptLabel>
              <PromptInput
                placeholder="e.g., A minimalist music note with gradient colors, a friendly robot mascot, a stylized calendar..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
              <GenerateHint>
                AI will create a unique icon based on your description
              </GenerateHint>
              
              {generatedPreview && (
                <GeneratedPreviewContainer>
                  <GeneratedPreviewLabel>Generated Icon</GeneratedPreviewLabel>
                  <GeneratedPreview src={generatedPreview} alt="Generated icon" />
                </GeneratedPreviewContainer>
              )}
            </GenerateContent>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ModalBody>

        <ModalFooter>
          <CancelButton type="button" onClick={handleClose} disabled={isLoading}>
            Cancel
          </CancelButton>
          {activeTab === 'upload' ? (
            <SaveButton
              type="button"
              onClick={handleUploadSave}
              disabled={isLoading || !imageSrc}
            >
              {isLoading ? 'Saving...' : 'Save Icon'}
            </SaveButton>
          ) : (
            <SaveButton
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? 'Generating...' : 'Generate Icon'}
            </SaveButton>
          )}
        </ModalFooter>
      </ModalContent>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.surface};
  border-radius: 20px;
  overflow: hidden;
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

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ $active, theme }) => $active ? theme.accent : theme.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${({ $active, theme }) => $active ? theme.accent : 'transparent'};
    transition: background 0.2s ease;
  }

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  min-height: 320px;
`;

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UploadArea = styled.div`
  width: 100%;
`;

const UploadLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 200px;
  border: 2px dashed ${({ theme }) => theme.border};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    background: ${({ theme }) => theme.accent}08;
  }
`;

const CurrentIconPreview = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 24px;
  object-fit: cover;
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const UploadIcon = styled.span`
  font-size: 2.5rem;
`;

const UploadText = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
`;

const UploadHint = styled.span`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const HiddenInput = styled.input`
  display: none;
`;

const CropContainer = styled.div`
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.backgroundAlt};
`;

const ZoomControl = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ZoomLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  min-width: 50px;
`;

const ZoomSlider = styled.input`
  flex: 1;
  height: 4px;
  appearance: none;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.accent};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.accent};
    cursor: pointer;
    border: none;
  }
`;

const ChangeImageButton = styled.button`
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: center;

  &:hover {
    border-color: ${({ theme }) => theme.text};
    color: ${({ theme }) => theme.text};
  }
`;

const GenerateContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PromptLabel = styled.label`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
`;

const PromptInput = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GenerateHint = styled.p`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
`;

const GeneratedPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  margin-top: 0.5rem;
`;

const GeneratedPreviewLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const GeneratedPreview = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: 0 4px 16px ${({ theme }) => theme.shadow};
`;

const ErrorMessage = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: #ef4444;
  margin: 0.5rem 0 0;
  text-align: center;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent} 0%, ${({ theme }) => theme.accentGold} 150%);
  border: none;
  border-radius: 10px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.accent}44;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export default IconEditModal;
