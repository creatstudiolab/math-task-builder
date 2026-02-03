export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, gradeLevel, imageFile, imageType } = req.body;

  if (!input?.trim() && !imageFile) {
    return res.status(400).json({ error: 'Please provide either text input or an image' });
  }

  try {
    const messageContent = [];

    if (imageFile) {
      let base64Data = imageFile;
      if (imageFile.includes(',')) {
        base64Data = imageFile.split(',')[1];
      }

      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageType || 'image/png',
          data: base64Data
        }
      });
    }

    const promptText = `Math content: "${input || 'image provided'}"
${gradeLevel ? `Grade: ${gradeLevel}` : ''}

Generate 4 tasks using Kaplinsky's cognitive demand framework.

Rules:
* L1: Do math (not just locate numbers)
* L2: Model/represent/explain strategy
* L3: Reason/justify (multiple valid approaches)
* L4: Generalize/create/apply to new context

Return ONLY valid JSON:
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
      console.error('No API key found!');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Making request to Anthropic API...');
    console.log('Message content types:', messageContent.map(m => m.type));

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ 
        role: 'user', 
        content: messageContent 
      }]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== ANTHROPIC API ERROR ===');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      console.error('Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500));
      
      return res.status(500).json({ 
        error: 'API request failed',
        status: response.status,
        details: errorText.substring(0, 500)
      });
    }

    const data = await response.json();
    console.log('Got response from Anthropic');
    
    const text = data.content?.find(item => item.type === 'text')?.text || '';
    
    if (!text) {
      console.error('No text in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'No text content in API response' });
    }
    
    let cleanText = text.trim().replace(/```json|```/g, '');
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON found in:', text.substring(0, 200));
      return res.status(500).json({ error: 'Failed to extract JSON' });
    }
    
    const questions = JSON.parse(jsonMatch[0]);

    res.status(200).json({ questions });
    
  } catch (error) {
    console.error('=== HANDLER ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to generate tasks',
      details: error.message,
      type: error.name
    });
  }
}
