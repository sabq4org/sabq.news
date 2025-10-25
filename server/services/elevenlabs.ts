import { Readable } from 'stream';

export interface TTSOptions {
  text: string;
  voiceId?: string;
  model?: string;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category?: string;
  labels?: Record<string, string>;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  // Arabic-compatible voice ID (ElevenLabs Multilingual v2)
  private defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice, works with Arabic

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async textToSpeech(options: TTSOptions): Promise<Buffer> {
    const voiceId = options.voiceId || this.defaultVoiceId;
    const model = options.model || 'eleven_multilingual_v2';
    
    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;
    
    const requestBody = {
      text: options.text,
      model_id: model,
      voice_settings: options.voiceSettings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('ElevenLabs get voices error:', error);
      throw new Error(`Failed to fetch voices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getVoiceById(voiceId: string): Promise<Voice | null> {
    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch voice: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ElevenLabs get voice error:', error);
      throw new Error(`Failed to fetch voice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  buildNewsletterScript(newsletterData: {
    title: string;
    description?: string;
    articles: Array<{
      title: string;
      excerpt?: string;
      aiSummary?: string;
    }>;
  }): string {
    const parts: string[] = [];
    
    // Introduction
    parts.push(`مرحباً بكم في ${newsletterData.title}.`);
    
    if (newsletterData.description) {
      parts.push(newsletterData.description);
    }
    
    // Articles
    newsletterData.articles.forEach((article, index) => {
      parts.push(`\n\nالخبر ${index + 1}: ${article.title}.`);
      
      const content = article.aiSummary || article.excerpt;
      if (content) {
        parts.push(content);
      }
    });
    
    // Closing
    parts.push('\n\nشكراً لاستماعكم إلى نشرة سبق الذكية.');
    
    return parts.join(' ');
  }
}

// Export singleton instance
let elevenLabsInstance: ElevenLabsService | null = null;

export function getElevenLabsService(): ElevenLabsService {
  if (!elevenLabsInstance) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    elevenLabsInstance = new ElevenLabsService(apiKey);
  }
  return elevenLabsInstance;
}
