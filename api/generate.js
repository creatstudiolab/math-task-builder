// If you're using Next.js (pages/api/*), this prevents base64 image bodies from being rejected/truncated.
// If you're NOT in Next.js pages router, you can remove this safely.
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req, res) {
  // Complete CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, gradeLevel, imageFile, imageType } = req.body || {};

  // Validate input
  const safeInput = typeof input === 'string' ? input.trim() : '';
  if (!safeInput && !imageFile) {
    return res.status(400).json({ error: 'Please provide either text input or an image' });
  }

  try {
    const messageContent = [];

    if (imageFile) {
      if (typeof imageFile !== 'string') {
        return res.status(400).json({ error: 'imageFile must be a base64 string or data URL string' });
      }

      // Strip ONLY data URL prefix if present (safer than splitting on any comma)
      let base64Data = imageFile;
      if (imageFile.startsWith('data:')) {
        const parts = imageFile.split(',');
        if (parts.length < 2) {
          return res.status(400).json({ error: 'Invalid data URL for imageFile' });
        }
        base64Data = parts[1];
      }

      // Basic sanity check (optional but helpful)
      if (!base64Data || base64Data.length < 50) {
        return res.status(400).json({ error: 'imageFile appears to be invalid or too small' });
      }

      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: (typeof imageType === 'string' && imageType.trim()) ? imageType.trim() : 'image/png',
          data: base64Data
        }
      });
    }

    // Build prompt: avoid wrapping user input in quotes (quotes can break prompt fidelity)
    const gradeLine = (typeof gradeLevel === 'string' && gradeLevel.trim()) ? `Grade: ${gradeLevel.trim()}` : '';

    const promptText = imageFile
      ? `Analyze the math problem in this image${safeInput ? ` and the following context:` : ''}.
${safeInput ? `\nContext:\n"""${safeInput}"""\n` : ''}
${gradeLine}

Generate 4 tasks using Kaplinsky's cognitive demand framework. Increase thinking quality, not number difficulty.

Rules:
* L1: Do math (not just locate numbers)
* L2: Model/represent/explain strategy
* L3: Reason/justify (multiple valid approaches)
* L4: Generalize/create/apply to new context
${gradeLine ? `* Use age-appropriate language/contexts for ${gradeLevel.trim()}` : ''}

Return ONLY valid JSON with no other text:
{
  "level1": "task text",
  "level2": "task text",
  "level3": "task text",
  "level4": "task text"
}`
      : `Math content:
"""${safeInput}"""
${gradeLine}

Generate 4 tasks using Kaplinsky's cognitive demand framework. Increase thinking quality, not number difficulty.

Rules:
* L1: Do math (not just locate numbers)
* L2: Model/represent/explain strategy
* L3: Reason/justify (multiple valid approaches)
* L4: Generalize/create/apply to new context
${gradeLine ? `* Use age-appropriate language/contexts for ${gradeLevel.trim()}` : ''}

Return ONLY valid JSON with no other text:
{
  "level1": "task text",
  "level2": "task text",
  "level3": "task text",
  "level4": "task text"
}`;

    messageContent.push({
      type: 'text',
      text: promptText
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ]
      })
    });

    if (!response.ok) {
      // Use .text() to avoid masking errors if response isn't JSON
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);

      // Forward useful status codes when possible (helps UI handle 401/429 etc.)
      const status = [400, 401, 403, 404, 409, 413, 415, 422, 429].includes(response.status)
        ? response.status
        : 500;

      return res.status(status).json({
        error: 'API request failed',
        details: `Status ${response.status}: ${errorText.substring(0, 500)}`
      });
    }

    const data = await response.json();
    const text = data?.content?.find((item) => item.type === 'text')?.text || '';

    if (!text) {
      return res.status(500).json({ error: 'No text content in API response' });
    }

    // Clean common fences
    let cleanText = String(text).trim().replace(/```json|```/g, '').trim();

    // Non-greedy: grab the first JSON-looking object. This reduces failures if extra braces appear later.
    const jsonMatch = cleanText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response. Raw:', text);
      return res.status(500).json({ error: 'Failed to extract JSON from response', raw: text.substring(0, 500) });
    }

    let questions;
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse failed. Extracted:', jsonMatch[0]);
      console.error('Raw response:', text);
      return res.status(500).json({ error: 'Invalid JSON from model', extracted: jsonMatch[0].substring(0, 500) });
    }

    // Validate response structure
    if (
      !questions ||
      typeof questions.level1 !== 'string' ||
      typeof questions.level2 !== 'string' ||
      typeof questions.level3 !== 'string' ||
      typeof questions.level4 !== 'string'
    ) {
      return res.status(500).json({ error: 'Incomplete or malformed response from API', questions });
    }

    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate tasks',
      details: error?.message || String(error)
    });
  }
}
