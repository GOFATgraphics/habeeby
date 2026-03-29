

# Habibi: Quran Companion — MVP Build Plan (with Anthropic Claude + ElevenLabs)

## Architecture Change
Instead of the Lovable AI Gateway, the chat edge function will call the **Anthropic Claude API** directly using your API key stored as a project secret.

## Secrets Required
1. **ANTHROPIC_API_KEY** — your Claude API key (needs to be added)
2. **ELEVENLABS_API_KEY** — your ElevenLabs key (needs to be added)
3. **LOVABLE_API_KEY** — already available (not used for AI, but available)

## Edge Functions

### 1. `supabase/functions/chat/index.ts`
- Receives messages from client
- Prepends the full Habibi system prompt (the companion persona you shared)
- Calls `https://api.anthropic.com/v1/messages` with `ANTHROPIC_API_KEY`
- Uses `claude-sonnet-4-20250514` (or whichever model you prefer)
- Streams response back via SSE (Anthropic supports native streaming)
- Handles rate limits and errors gracefully

### 2. `supabase/functions/elevenlabs-tts/index.ts`
- Accepts text, calls ElevenLabs TTS API, returns audio blob

### 3. `supabase/functions/elevenlabs-stt/index.ts`
- Accepts audio blob, calls ElevenLabs STT (Scribe) API, returns transcript

## Frontend Pages & Components

### Landing Page (`/`)
- Warm Islamic design: cream (#F5F0E8), sage green (#6B8F71), gold (#C4A265)
- "Habibi — Your Quran Companion" branding
- "Begin Your Journey" CTA → `/chat`

### Chat Page (`/chat`)
- Streaming chat UI with Habibi persona
- Mic button for voice input (ElevenLabs STT)
- Speaker icon on Habibi messages for TTS playback
- Markdown rendering for Quran/Hadith citations
- Onboarding modal on first visit (name + intention)
- localStorage for conversation persistence

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/index.css` | Warm Islamic color theme |
| `src/App.tsx` | Add `/chat` route |
| `src/pages/Index.tsx` | Landing page |
| `src/pages/Chat.tsx` | Chat interface |
| `src/hooks/useChat.ts` | Streaming chat with Anthropic SSE format |
| `src/hooks/useVoice.ts` | ElevenLabs TTS/STT |
| `src/components/ChatMessage.tsx` | Message bubble + listen button |
| `src/components/ChatInput.tsx` | Text input + mic button |
| `src/components/OnboardingModal.tsx` | First-visit modal |
| `supabase/functions/chat/index.ts` | Claude API integration with Habibi prompt |
| `supabase/functions/elevenlabs-tts/index.ts` | Text-to-speech |
| `supabase/functions/elevenlabs-stt/index.ts` | Speech-to-text |

## Key Anthropic-Specific Details
- Anthropic uses a different streaming format (`event: content_block_delta` with `delta.text`) — the `useChat` hook will parse this correctly
- Auth header: `x-api-key` (not Bearer token)
- API version header: `anthropic-version: 2023-06-01`
- The full Habibi system prompt goes in the `system` field (not as a message)

## Implementation Order
1. Request secrets (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY)
2. Create all 3 edge functions
3. Build design system + landing page
4. Build chat page with streaming
5. Add voice controls
6. Add onboarding + localStorage

