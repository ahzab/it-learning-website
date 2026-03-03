# Gemini AI Migration

All AI calls have been migrated from Anthropic Claude to Google Gemini.

## Models Used

| Task | Model | Why |
|------|-------|-----|
| Real-time streaming (builder AI panel) | `gemini-2.5-flash` | Ultra-fast, cheap, great for streaming |
| CV generation from description | `gemini-2.5-pro` | Best accuracy + JSON mode |
| CV tailoring for job postings | `gemini-2.5-pro` | Complex reasoning |
| LinkedIn profile extraction | `gemini-2.5-pro` | Structured data extraction |
| Career intelligence analysis | `gemini-2.5-pro` | Deep analysis |

## Setup

1. Get your API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Add to your `.env.local`:
   ```
   GEMINI_API_KEY=AIza...
   ```

## Key Advantages

- **Free tier**: 1,000 requests/day on Flash, 50/day on Pro — perfect for development
- **1M token context**: Handle very large CVs and LinkedIn exports
- **Native JSON mode**: `responseMimeType: 'application/json'` guarantees valid JSON output
- **Arabic quality**: Excellent Modern Standard Arabic generation
- **Cost**: ~10× cheaper than comparable Anthropic models at scale

## Files Changed

- `lib/ai/gemini.ts` — New Gemini client (replaces `anthropic.ts`)
- `lib/ai/index.ts` — Updated barrel export
- `lib/services/ai.service.ts` — Already imports from `gemini`
- `hooks/useAI.ts` — Already handles Gemini's SSE format
- `.env.example` — Updated with `GEMINI_API_KEY`

## SSE Format

The builder AI panel hook (`hooks/useAI.ts`) reads our unified SSE format:
```
data: {"type":"delta","text":"chunk text here"}
data: [DONE]
```

`gemini.ts` translates Gemini's native SSE format into this unified format automatically.
