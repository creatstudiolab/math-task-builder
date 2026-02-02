export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, gradeLevel, imageFile, imageType } = req.body;

  try {
    const messageContent = [];

    if (imageFile) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageType,
          data: imageFile
        }
      });
    }

    const promptText = imageFile
      ? `Analyze the math problem in this image${input ? ` and context: "${input}"` : ''}.
${gradeLevel ? `Grade: ${gradeLevel}` : ''}

Generate 4 tasks using Kaplinsky's cognitive demand framework. Increase thinking quality, not number difficulty.

Rules:
* L1: Do math (not just locate numbers)
* L2: Model/represent/explain strategy
* L3: Reason/justify (multiple valid approaches)
* L4: Generalize/create/apply to new context
${gradeLevel ? `* Use age-appropriate language/contexts for ${gradeLevel}` : ''}

Return ONLY valid JSON:
{
  "level1": "task text",
  "level2": "task text",
  "level3": "task text",
  "level4": "task text"
}`
      : `Math content: "${input}"
${gradeLevel ? `Grade: ${gradeLevel}` : ''}

Generate 4 tasks using Kaplinsky's cognitive demand framework. Increase thinking quality, not number difficulty.

Rules:
* L1: Do math (not just locate numbers)
* L2: Model/represent/explain strategy
* L3: Reason/justify (multiple valid approaches)
* L4: Generalize/create/apply to new context
${gradeLevel ? `* Use age-appropriate language/contexts for ${gradeLevel}` : ''}

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: messageContent }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content.find(item => item.type === 'text')?.text || '';
    const cleanText = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(cleanText);

    res.status(200).json({ questions });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate tasks' });
  }
}
