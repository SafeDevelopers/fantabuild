/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type GenerationMode = 'web' | 'mobile' | 'social' | 'logo';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Generate content using Gemini AI via backend API
 * This ensures the API key is secure on the server
 */
export async function bringToLife(
  prompt: string,
  fileBase64?: string,
  mimeType?: string,
  mode: GenerationMode = 'web',
  userId?: string
): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required for generation');
  }

  try {
    const token = localStorage.getItem('fanta_build_token');
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        prompt,
        fileBase64,
        mimeType,
        mode,
      }),
    });

    if (!response.ok) {
      // Try to parse JSON error, but handle HTML responses
      let error;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
      } else {
        // If response is HTML (error page), get text instead
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }
      
      // Handle user daily limit (429 from our backend)
      if (response.status === 429 && error.type !== 'quota_exceeded') {
        throw new Error(
          error.isPro
            ? "You've reached the daily limit of 20 generations to ensure fair system performance."
            : "You've reached your free limit of 3 generations for today. Subscribe to Pro for more!"
        );
      }
      
      // Handle Gemini API quota exceeded (503 from our backend)
      if (response.status === 503 && error.type === 'quota_exceeded') {
        throw new Error(
          'AI Service Quota Exceeded: The Gemini API quota has been exceeded. Please check your Google Cloud billing and quota limits. The service will be available again once the quota resets or is increased.'
        );
      }
      
      throw new Error(error.message || error.error || 'Failed to generate content');
    }

    // Parse JSON response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid response format: Expected JSON but got ${contentType || 'unknown'}`);
    }

    const data = await response.json();
    return data.html;
  } catch (error: any) {
    console.error('Generation error:', error);
    throw error;
  }
}
