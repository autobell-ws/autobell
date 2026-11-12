export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { provider = 'google-free', text, settings = {} } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const cleanText = text.trim();

    if (provider === 'google-free') {
      const { language = 'en' } = settings;
      const gLanguage = language === 'ur' ? 'ur' : (language === 'ar' ? 'ar' : 'en');

      // Chunk text into sentences/phrases of max 150 chars
      const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+/g) || [cleanText];
      const chunks = [];
      let current = '';
      for (const s of sentences) {
        if ((current + s).length > 150) {
          if (current) chunks.push(current.trim());
          current = s;
        } else {
          current += (current ? ' ' : '') + s;
        }
      }
      if (current) chunks.push(current.trim());

      const buffers = [];
      for (const chunk of chunks) {
        const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(gLanguage)}&client=tw-ob`;
        const ttsRes = await fetch(gUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (!ttsRes.ok) {
          throw new Error(`Google Translate TTS request failed with status: ${ttsRes.status}`);
        }

        const arrayBuffer = await ttsRes.arrayBuffer();
        buffers.push(Buffer.from(arrayBuffer));
      }

      const finalBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', finalBuffer.length);
      return res.status(200).send(finalBuffer);
    }

    if (provider === 'openai') {
      const apiKey = settings.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenAI API Key is required' });
      }
      const model = settings.model || 'tts-1';
      const voice = settings.voice || 'alloy';
      const baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');

      const openAiRes = await fetch(`${baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: cleanText,
          voice,
          response_format: 'mp3'
        })
      });

      if (!openAiRes.ok) {
        const errJson = await openAiRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI TTS failed (${openAiRes.status})`);
      }

      const ab = await openAiRes.arrayBuffer();
      const buf = Buffer.from(ab);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    }

    return res.status(400).json({ error: `Provider ${provider} not supported by endpoint` });
  } catch (err) {
    console.error('generate-speech error:', err);
    return res.status(500).json({ error: err.message || 'Speech generation failed' });
  }
}

