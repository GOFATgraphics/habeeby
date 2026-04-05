

# Fix Habibi Chat Error + Future Migration Plan

## What's Wrong

The chat edge function returns **401 Unauthorized** every time. Two root causes:

1. **Google OAuth is broken**: `Auth.tsx` calls `supabase.auth.signInWithOAuth("google")` directly, but Lovable Cloud requires using `lovable.auth.signInWithOAuth("google")` from the auto-generated module. The direct Supabase call doesn't work with Lovable Cloud's managed Google OAuth — so users can't sign in with Google at all.

2. **Session not established**: Because sign-in fails or doesn't complete properly, the chat function receives an invalid/missing JWT and returns 401. The client then shows the generic "Forgive me, ya habibi" error.

## Fix Plan (Priority 1: Get Habibi Working)

### Step 1: Fix Google OAuth in Auth.tsx

Replace `supabase.auth.signInWithOAuth` with `lovable.auth.signInWithOAuth` from `@/integrations/lovable`. This uses Lovable Cloud's managed Google credentials and properly sets the session.

```typescript
import { lovable } from '@/integrations/lovable';

const handleGoogleAuth = async () => {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) toast.error(result.error.message || 'Google sign-in failed');
  if (result.redirected) return;
  // Session is set automatically — navigate
  navigate('/home', { replace: true });
};
```

### Step 2: Add better error logging in chat edge function

Add a console.log before the auth check to see exactly what token is being received. Also add the missing CORS headers for `x-supabase-client-*` headers that the client sends.

### Step 3: Ensure session refresh works

The `getAuthHeader()` in `useChat.ts` already tries to refresh — this is correct. But if Google OAuth never worked, there's no session to refresh. Fixing Step 1 resolves this.

## Migration Plan (Priority 2: Future Work on Your Own Supabase)

Once Habibi is working here, to move to your own Supabase project you would need to:

1. **Create a new Lovable project** (or a standalone app) that connects to your external Supabase project via the Supabase Integration connector
2. **Copy the schema**: Run the same migrations (`messages` table, `profiles` table, RLS policies) in your external Supabase dashboard
3. **Copy edge functions**: Deploy `chat`, `elevenlabs-tts`, `elevenlabs-stt` to your external Supabase project using the Supabase CLI
4. **Set secrets**: Add `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` in your external Supabase project
5. **Import data**: Use the CSV exports you already have to import into the new tables
6. **Update client config**: Point the new project's `.env` to your external Supabase URL and anon key

This current project will remain on Lovable Cloud — the migration would be a new project.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Replace `supabase.auth.signInWithOAuth` with `lovable.auth.signInWithOAuth` |
| `supabase/functions/chat/index.ts` | Improve CORS headers and error logging |

## What Won't Change
- Habibi's personality, system prompt, and response behavior
- Chat persistence logic, reactions, swipe-to-reply
- Memory system (profiles table, Haiku summarization)

