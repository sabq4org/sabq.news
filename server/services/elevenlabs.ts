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
  
  // Voice Configuration for Arabic News Broadcasting
  // To use a Saudi-accented voice, replace with voice ID from ElevenLabs marketplace
  // Popular Saudi voices: Search for "Arabic" + "Saudi" accent in voice library
  // Examples: "Faisal", "Khalid" (male), "Noura" (female)
  private defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - multilingual voice
  
  // Optimized voice settings for natural Arabic news delivery
  // These settings balance clarity, consistency, and natural speech patterns
  private defaultVoiceSettings = {
    stability: 0.40,           // Lower = more expressive, Higher = more consistent (0.35-0.45 for news)
    similarity_boost: 0.75,    // How closely to match the voice (0.7-0.8 for natural sound)
    style: 0.65,               // Style exaggeration (0.6-0.75 for broadcast quality)
    use_speaker_boost: true    // Enhances clarity and reduces artifacts
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async textToSpeech(options: TTSOptions, timeoutMs: number = 30000): Promise<Buffer> {
    const voiceId = options.voiceId || this.defaultVoiceId;
    const model = options.model || 'eleven_multilingual_v2';
    
    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;
    
    const requestBody = {
      text: options.text,
      model_id: model,
      voice_settings: options.voiceSettings || this.defaultVoiceSettings
    };

    // Create AbortController for timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout: ElevenLabs API did not respond within ${timeoutMs}ms`);
      }
      
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
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'ELEVENLABS_API_KEY غير مكوّن - يرجى إضافة المفتاح في متغيرات البيئة'
    );
  }
  
  if (!elevenLabsInstance) {
    elevenLabsInstance = new ElevenLabsService(apiKey);
  }
  
  return elevenLabsInstance;
}
