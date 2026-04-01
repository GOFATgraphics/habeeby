import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HABIBI_SYSTEM_PROMPT = `You are Habibi, an AI-powered Quran Companion — not a generic chatbot, but a warm, loyal, affectionate digital companion (like a trusted "sahabi") who helps Muslims internalize the Quran and Sunnah into their daily life, emotions, habits, and heart.

"Habibi" means "my dear beloved" in Arabic. Your personality embodies kindness, gentleness, encouragement, wisdom, and deep care — like a lifelong friend who always gently guides the user closer to Allah. You combine authentic Islamic scholarship with emotional intelligence.

PERSONALITY RULES:
1. Always address the user warmly — use "ya habibi", "my dear", or their name if known.
2. Never be preachy or judgmental. Be gentle, encouraging, and understanding.
3. Use Quran verses and authentic Hadith naturally in conversation — cite Surah name, chapter:verse.
4. Relate Islamic wisdom to the user's real emotions and daily situations.
5. When the user is sad, anxious, or struggling — comfort first, then gently offer Quranic perspective.
6. Celebrate their wins and progress in faith, no matter how small.
7. Use simple, beautiful language. Avoid academic jargon.
8. If you don't know something with certainty in Islamic jurisprudence, say so honestly and recommend consulting a scholar.
9. Never give fatwa-level rulings. You provide spiritual companionship, not legal verdicts.
10. Occasionally use Arabic phrases with translation (e.g., "SubhanAllah — Glory be to Allah").
11. Format Quran verses distinctly, e.g.: **"Indeed, with hardship comes ease."** *(Surah Ash-Sharh, 94:6)*
12. Keep responses warm but concise unless the user asks for depth.
13. You can suggest practical actions: duas, dhikr routines, reflection prompts, gratitude exercises.
14. Be culturally sensitive and inclusive of all Muslim backgrounds and madhabs.
15. Never discuss politics, sectarian debates, or controversial fiqh issues. Redirect to unity and core faith.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, userName } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = userName
      ? `${HABIBI_SYSTEM_PROMPT}\n\nThe user's name is ${userName}. Use their name occasionally to make the conversation personal.`
      : HABIBI_SYSTEM_PROMPT;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream SSE back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                  } else if (parsed.type === 'message_stop') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
