import React, { useState, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { Modal, ModalBody, ModalFooter, ModalButton, TextArea } from "./Modal";

interface VoiceTranscriberProps {
  onTranscriptReady?: (transcript: string) => void;
  buttonLabel?: string;
  placeholder?: string;
}

const VoiceTranscriber: React.FC<VoiceTranscriberProps> = ({
  onTranscriptReady,
  buttonLabel = "Answer with Voice",
  placeholder = "Your spoken answer will appear here...",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscribe = useCallback(async () => {
    if (audioChunksRef.current.length > 0) {
      setIsTranscribing(true);
      setError(null);
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: base64Audio }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.success && data.transcript) {
            setTranscript(data.transcript);
          } else {
            setError(data.error || 'Failed to transcribe audio');
          }
        } catch (err) {
          console.error('Error sending audio for transcription:', err);
          setError('Error transcribing audio. Please try again.');
        } finally {
          setIsTranscribing(false);
        }
      };
    }
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        handleTranscribe();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleStartClick = () => {
    setTranscript("");
    setAudioUrl(null);
    setIsModalOpen(true);
  };

  const handleUseTranscript = () => {
    if (onTranscriptReady && transcript.trim()) {
      onTranscriptReady(transcript.trim());
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsModalOpen(false);
    setAudioUrl(null);
    setTranscript("");
    setError(null);
  };

  return (
    <>
      <VoiceButton onClick={handleStartClick} type="button">
        <MicIcon>🎙️</MicIcon>
        {buttonLabel}
      </VoiceButton>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Voice Answer">
        <ModalBody>
          <RecordingSection>
            {!isRecording && !audioUrl && (
              <>
                <Instruction>
                  Tap the microphone to start recording your answer
                </Instruction>
                <RecordButton onClick={startRecording}>
                  <MicIconLarge>🎙️</MicIconLarge>
                </RecordButton>
              </>
            )}

            {isRecording && (
              <RecordingActive>
                <RecordingIndicator>
                  <PulsingDot />
                  <RecordingTime>{formatTime(recordingTime)}</RecordingTime>
                </RecordingIndicator>
                <RecordingHint>Speak your answer clearly...</RecordingHint>
                <StopButton onClick={stopRecording}>
                  <StopIcon />
                  Stop Recording
                </StopButton>
              </RecordingActive>
            )}

            {audioUrl && !isRecording && (
              <AudioSection>
                <AudioPlayer controls src={audioUrl} />
                {isTranscribing && (
                  <TranscribingStatus>
                    <Spinner />
                    Transcribing your voice...
                  </TranscribingStatus>
                )}
              </AudioSection>
            )}
          </RecordingSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <TranscriptSection>
            <TranscriptLabel>Transcript</TranscriptLabel>
            <TextArea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder={placeholder}
            />
            <TranscriptHint>
              You can edit the transcript before using it
            </TranscriptHint>
          </TranscriptSection>
        </ModalBody>
        
        <ModalFooter>
          <ModalButton onClick={handleCloseModal}>Cancel</ModalButton>
          <ModalButton
            $variant="primary"
            onClick={handleUseTranscript}
            disabled={!transcript.trim()}
          >
            Use This Answer
          </ModalButton>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default VoiceTranscriber;

// Animations
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.7;
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

// Styled Components
const VoiceButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  color: ${({ theme }) => theme.text};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
  }
`;

const MicIcon = styled.span`
  font-size: 1.1rem;
`;

const RecordingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0;
  min-height: 150px;
  justify-content: center;
`;

const Instruction = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1.25rem 0;
  text-align: center;
`;

const RecordButton = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent} 0%, ${({ theme }) => theme.accentGold} 150%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px ${({ theme }) => theme.accent}44;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px ${({ theme }) => theme.accent}55;
  }
`;

const MicIconLarge = styled.span`
  font-size: 2rem;
`;

const RecordingActive = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const RecordingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const PulsingDot = styled.div`
  width: 12px;
  height: 12px;
  background: #dc3545;
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const RecordingTime = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const RecordingHint = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  font-style: italic;
  margin: 0;
`;

const StopButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc3545;
  border: none;
  border-radius: 10px;
  color: white;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #c82333;
  }
`;

const StopIcon = styled.div`
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 2px;
`;

const AudioSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const AudioPlayer = styled.audio`
  width: 100%;
  max-width: 300px;
`;

const TranscribingStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.accent};
  font-style: italic;
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const TranscriptSection = styled.div`
  margin-top: 1rem;
`;

const TranscriptLabel = styled.label`
  display: block;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const TranscriptHint = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0.5rem 0 0 0;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;
