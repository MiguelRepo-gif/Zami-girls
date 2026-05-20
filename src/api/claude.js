const VALID_PERSONALITY = ['Playful', 'Mysterious', 'Confident', 'Sweet', 'Adventurous', 'Sophisticated', 'Bubbly', 'Intense']
const VALID_TONES       = ['Flirty', 'Empowering', 'Relatable', 'Aspirational', 'Humorous', 'Sensual', 'Educational']

function buildPrompt(name, niche, traits) {
  return `You are creating a social media influencer profile. Return ONLY valid JSON, no markdown, no code blocks.

Influencer: "${name}"
Niche: "${niche}"
Appearance: ${traits.ethnicity}, ${traits.skin_tone} skin, ${traits.hair_color} ${traits.hair_length} hair

Return this exact JSON structure:
{
  "bio": "Instagram bio, max 150 chars, include relevant emojis",
  "backstory": "3-4 sentences compelling origin story for this influencer",
  "personality": ["trait1", "trait2", "trait3"],
  "content_tone": ["tone1", "tone2"],
  "target_audience": "describe the target audience",
  "unique_selling_point": "what makes her unique among influencers",
  "hashtag_style": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5",
  "values": "brand values, comma separated",
  "posting_frequency": "2 posts/day",
  "languages": "Spanish, English"
}

Personality must use only values from: ${VALID_PERSONALITY.join(', ')}
Content tone must use only values from: ${VALID_TONES.join(', ')}
Make the profile authentic, aspirational, and tailored to the niche.`
}

export async function generateModelProfile(name, niche, traits) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('VITE_ANTHROPIC_API_KEY no configurada')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: buildPrompt(name, niche, traits) }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Claude no devolvió JSON válido')
  }
}
