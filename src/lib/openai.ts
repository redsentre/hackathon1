import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    console.log('Creating OpenAI client, API key exists:', !!apiKey);
    console.log('Using base URL:', baseURL);
    client = new OpenAI({
      apiKey: apiKey || '',
      baseURL: baseURL,
    });
  }
  return client;
}
