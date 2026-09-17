// Shared serverless proxy for all three Socials by Lucybelle client tools.
// Keeps the Anthropic API key server-side (set as ANTHROPIC_API_KEY in Vercel env vars).

const BRAND_VOICE = `Brand voice: Socials by Lucybelle, an Australian social media management business.
Tone: warm, confident, non-corporate, editorial, like advice from a knowledgeable friend who is also an expert.
Australian English. No jargon, no hype, no filler like "in today's digital landscape". Never mention hashtags.
These tools are free lead magnets, not the full service. Deliberately hold back full execution and strategic depth,
give a genuine, useful taste, not the complete answer, so the reader still sees clear value in booking a call.`;

function buildPrompt(tool, fields) {
  if (tool === 'audit') {
    return `${BRAND_VOICE}

You are scoring an Instagram profile for a free audit tool. Be honest, specific, and encouraging, never generic.

Business/industry: ${fields.industry || 'not specified'}
Current bio: ${fields.bio || 'not provided'}
Posting frequency: ${fields.postingFrequency || 'not specified'}
Main business goal right now: ${fields.businessGoal || 'not specified'}

Score across exactly these five categories, each out of 10: Bio Clarity, Visual Consistency, Posting Rhythm, Content Mix, Conversion Clarity.
Give exactly 2 quick wins, small, specific, actionable today. Do not give a full strategy or more than 2 wins, deliberately.

Return ONLY valid JSON, no markdown, no preamble:
{
  "overall_score": <number 0-100>,
  "grade": "<one of: Needs Attention, Good Foundation, Strong, Excellent>",
  "categories": [
    {"name": "Bio Clarity", "score": <0-10>, "note": "<one sentence>"},
    {"name": "Visual Consistency", "score": <0-10>, "note": "<one sentence>"},
    {"name": "Posting Rhythm", "score": <0-10>, "note": "<one sentence>"},
    {"name": "Content Mix", "score": <0-10>, "note": "<one sentence>"},
    {"name": "Conversion Clarity", "score": <0-10>, "note": "<one sentence>"}
  ],
  "quick_wins": ["<win 1>", "<win 2>"],
  "locked_teaser": "<one warm sentence teasing that the full growth strategy and content plan is what a Clarity Call covers>"
}`;
  }

  if (tool === 'bio') {
    return `${BRAND_VOICE}

Rewrite this Instagram bio using the formula: what you do, who you help, one clear next step. No jargon, no cleverness at the expense of clarity.

Current bio: ${fields.currentBio || 'not provided'}
Industry: ${fields.industry || 'not specified'}
Who they help: ${fields.whoTheyHelp || 'not specified'}

Give exactly ONE strong rewritten bio, not several options, this is a free tool and should give one genuinely great answer, not an overwhelming menu.

Return ONLY valid JSON, no markdown, no preamble:
{
  "rewritten_bio": "<the rewritten bio, under 150 characters, formatted the way it would appear on Instagram with line breaks if useful>",
  "why_it_works": "<1-2 sentences on why this version works better>",
  "locked_teaser": "<one warm sentence teasing that a fully tailored bio plus highlight covers, pinned posts and link setup is part of what's done for clients>"
}`;
  }

  if (tool === 'five') {
    return `${BRAND_VOICE}

Take this one idea and turn it into ready-to-use content. Give full execution for a caption and a carousel outline only.
For the remaining three formats (a Reel/Story script, a poll or question sticker prompt, and a saved highlight idea), give only a one-line teaser describing what it would be, not the full execution. This is deliberate, the free tool should not hand over everything.

The one idea: ${fields.oneIdea || 'not provided'}
Industry/niche: ${fields.industry || 'not specified'}

Return ONLY valid JSON, no markdown, no preamble:
{
  "caption": "<a full, ready-to-post caption in Lucy's voice, 3-5 sentences, no hashtags>",
  "carousel_outline": "<a 3-step carousel outline, one short line per slide>",
  "teased_formats": [
    "<one-line teaser for the Reel/Story script version, describing it, not writing it>",
    "<one-line teaser for the poll/question sticker version>",
    "<one-line teaser for the saved highlight version>"
  ],
  "locked_teaser": "<one warm sentence teasing that a full month of content, all five formats fully written, is what a Socials by Lucybelle client gets every month>"
}`;
  }

  throw new Error('Unknown tool');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { tool, ...fields } = req.body || {};
    if (!tool) { res.status(400).json({ error: 'Missing tool' }); return; }
    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'Server is not configured with an API key yet. Add ANTHROPIC_API_KEY in Vercel project settings.' });
      return;
    }

    const prompt = buildPrompt(tool, fields);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) { res.status(502).json({ error: data.error.message || 'Upstream error' }); return; }

    const raw = (data.content || []).map(c => c.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) { res.status(502).json({ error: 'Could not parse a response, please try again.' }); return; }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
};
