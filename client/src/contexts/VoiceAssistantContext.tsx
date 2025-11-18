import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

type VoiceCommand = {
  command: string;
  action: () => void;
  description: string;
};

type VoiceAssistantProviderProps = {
  children: React.ReactNode;
};

type VoiceAssistantProviderState = {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, lang?: string) => Promise<void>;
  stopSpeaking: () => void;
  registerCommand: (command: VoiceCommand) => void;
  unregisterCommand: (command: string) => void;
};

const VoiceAssistantContext = createContext<VoiceAssistantProviderState | undefined>(
  undefined
);

// Check if browser supports Web Speech API
const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

export function VoiceAssistantProvider({ children }: VoiceAssistantProviderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(
    isSpeechRecognitionSupported() && isSpeechSynthesisSupported()
  );
  
  const recognitionRef = useRef<any>(null);
  const commandsRef = useRef<Map<string, VoiceCommand>>(new Map());

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('voice:listening-start'));
    };

    recognition.onend = () => {
      setIsListening(false);
      window.dispatchEvent(new CustomEvent('voice:listening-end'));
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      
      // Dispatch event with transcript
      window.dispatchEvent(
        new CustomEvent('voice:command', {
          detail: { transcript, confidence: event.results[0][0].confidence },
        })
      );

      // Check for registered commands
      commandsRef.current.forEach((cmd) => {
        if (transcript.includes(cmd.command.toLowerCase())) {
          cmd.action();
        }
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      window.dispatchEvent(
        new CustomEvent('voice:error', {
          detail: { error: event.error },
        })
      );
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }, [isListening]);

  const speak = useCallback(
    async (text: string, lang: string = 'ar-SA'): Promise<void> => {
      if (!isSpeechSynthesisSupported()) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          window.dispatchEvent(
            new CustomEvent('voice:speaking-start', { detail: { text } })
          );
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          window.dispatchEvent(
            new CustomEvent('voice:speaking-end', { detail: { text } })
          );
          resolve();
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          window.dispatchEvent(
            new CustomEvent('voice:speaking-error', {
              detail: { error: event.error },
            })
          );
          reject(event);
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    if (!isSpeechSynthesisSupported()) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const registerCommand = useCallback((command: VoiceCommand) => {
    commandsRef.current.set(command.command.toLowerCase(), command);
  }, []);

  const unregisterCommand = useCallback((command: string) => {
    commandsRef.current.delete(command.toLowerCase());
  }, []);

  return (
    <VoiceAssistantContext.Provider
      value={{
        isListening,
        isSpeaking,
        isSupported,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        registerCommand,
        unregisterCommand,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error("useVoiceAssistant must be used within VoiceAssistantProvider");
  }
  return context;
};

// Utility hook to register voice commands
export const useVoiceCommand = (
  command: string,
  action: () => void,
  description: string
) => {
  const { registerCommand, unregisterCommand } = useVoiceAssistant();

  useEffect(() => {
    registerCommand({ command, action, description });
    return () => unregisterCommand(command);
  }, [command, action, description, registerCommand, unregisterCommand]);
};
