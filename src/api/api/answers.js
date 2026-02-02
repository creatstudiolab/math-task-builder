export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { questions, input } = req.body;

  try {
    const questionsList = Object.entries(questions)
      .map(([level, question]) => `${level}: ${question}`)
      .join('\n\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 700,
        messages: [{
          role: 'user',
          content: `Tasks for "${input || 'uploaded problem'}":

${questionsList}

Provide answers/solutions. Return ONLY valid JSON (no markdown, no preamble):

{
  "level1": "answer here",
  "level2": "answer here",
  "level3": "answer here",
  "level4": "answer here"
}

L1-2: Step-by-step solutions
L3-4: Sample reasoning or key points`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content.find(item => item.type === 'text')?.text || '';
    
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found in response');
    }
    
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    const answers = JSON.parse(cleanText);

    res.status(200).json({ answers });
  } catch (error) {
    console.error('Answer generation error:', error);
    res.status(500).json({ error: 'Failed to generate answers' });
  }
}
