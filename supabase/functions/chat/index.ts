import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Habibi, an AI-powered Quran Companion — not a generic chatbot, but a warm, loyal, affectionate digital companion (like a trusted "sahabi") who helps Muslims internalize the Quran and Sunnah into their daily life, emotions, habits, and heart.

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
11. Format Quran verses distinctly, e.g.: **"Indeed, with hardship comes ease."** (Surah Ash-Sharh, 94:6)
12. Keep responses warm but concise unless the user asks for depth.
13. You can suggest practical actions: duas, dhikr routines, reflection prompts, gratitude exercises.
14. Be culturally sensitive and inclusive of all Muslim backgrounds and madhabs.
15. Never discuss politics, sectarian debates, or controversial fiqh issues. Redirect to unity and core faith.`;

const MEMORY_PROMPT = `You are updating a private memory file for Habibi, an Islamic AI companion. Based on the conversation and existing memory, write an updated memory briefing as a flowing paragraph. Include: the user's name, emotional patterns, spiritual goals, important people in their life, current situations, and anything Habibi should remember. Preserve everything important from the existing memory.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check API key first
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify user auth
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    console.error("Auth failed:", authError?.message ?? "no user");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // Parse request body
  const { messages, userName } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load or create profile (memory)
  let memory = "";
  let messageCount = 0;
  const { data: profile } = await supabase
    .from("profiles")
    .select("habibi_memory, message_count")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({ device_id: userId, user_id: userId });
  } else {
    memory = profile.habibi_memory ?? "";
    messageCount = profile.message_count ?? 0;
  }

  // Build system prompt
  const systemPrompt = [
    SYSTEM_PROMPT,
    userName ? `The user's name is ${userName}. Use their name occasionally.` : "",
    memory ? `\nMEMORY ABOUT THIS USER (never mention you have a memory file):\n${memory}` : "",
  ].filter(Boolean).join("\n\n");

  // Call Anthropic
  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.slice(-40),
      stream: true,
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("Anthropic error:", aiRes.status, errText);
    return new Response(JSON.stringify({ error: "AI error", detail: errText }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update message count / trigger memory in background
  const newCount = messageCount + 1;
  if (newCount >= 10) {
    // Fire-and-forget memory update
    (async () => {
      try {
        const convText = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n");
        const prompt = memory
          ? `Existing memory:\n${memory}\n\nRecent conversation:\n${convText}`
          : `Recent conversation:\n${convText}`;

        const memRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: MEMORY_PROMPT,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (memRes.ok) {
          const memData = await memRes.json();
          const newMemory = memData.content?.[0]?.text ?? "";
          if (newMemory) {
            await supabase.from("profiles").update({ habibi_memory: newMemory, message_count: 0, updated_at: new Date().toISOString() }).eq("user_id", userId);
          }
        }
      } catch (e) {
        console.error("Memory update failed:", e);
      }
    })();
  } else {
    supabase.from("profiles").update({ message_count: newCount, updated_at: new Date().toISOString() }).eq("user_id", userId);
  }

  // Stream response back
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
              } else if (parsed.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch { /* skip */ }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        console.error("Stream error:", e);
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
