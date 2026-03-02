# سيرتي.ai — Mobile API Reference

Base URL: `https://seerti.ai/api/mobile`

All responses follow this envelope:
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "...", "code": "ERROR_CODE" } }
```

All authenticated requests require:
```
Authorization: Bearer <token>
Content-Type: application/json
```

CORS is enabled for all origins — safe to call from React Native / Flutter.

---

## Authentication

### Register
`POST /auth/register`

Creates a new account and returns a JWT token (30-day expiry).

**Body**
```json
{ "name": "أحمد بنعلي", "email": "ahmed@example.com", "password": "min8chars" }
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": "clx...", "name": "أحمد بنعلي", "email": "ahmed@example.com", "plan": "FREE" }
  }
}
```

**Error codes:** `MISSING_FIELDS` · `WEAK_PASSWORD` · `INVALID_EMAIL` · `EMAIL_EXISTS`

---

### Login
`POST /auth/login`

**Body**
```json
{ "email": "ahmed@example.com", "password": "your-password" }
```

**Response 200** — same shape as register.

**Error codes:** `MISSING_FIELDS` · `INVALID_CREDENTIALS`

---

### Get / Update Profile
`GET /auth/me` — Returns current user + a **fresh token** (auto-renew pattern).

`PATCH /auth/me` — Update name or profile image.

**PATCH Body**
```json
{ "name": "Ahmed Benali", "image": "https://..." }
```

**Response**
```json
{
  "success": true,
  "data": {
    "token": "eyJ... (fresh)",
    "user": { "id": "clx...", "name": "Ahmed Benali", "email": "ahmed@example.com", "plan": "FREE", "image": null, "createdAt": "2024-01-01T..." }
  }
}
```

> **Token renewal pattern**: Call `GET /auth/me` on app launch. If it returns a fresh token, store it and discard the old one. This keeps sessions alive without a separate refresh endpoint.

---

## CV Management

### List CVs
`GET /cv`

**Response**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "cvs": [
      {
        "id": "clx...",
        "title": "سيرتي — مطور برمجيات",
        "template": "golden",
        "language": "AR",
        "country": "MA",
        "updatedAt": "2024-01-15T...",
        "createdAt": "2024-01-10T...",
        "data": { ... full CVData ... }
      }
    ]
  }
}
```

---

### Get CV
`GET /cv/:id`

---

### Create CV
`POST /cv`

**Body**
```json
{
  "title": "سيرتي — مطور برمجيات",
  "template": "golden",
  "language": "AR",
  "country": "MA",
  "data": { ...CVData object... }
}
```

**Response 201** — returns `{ cv: { id, ... } }`

---

### Update CV (full)
`PUT /cv/:id`

Same body as Create. All fields optional except `data`.

---

### Partial Update
`PATCH /cv/:id`

Same as PUT — use for saving incremental changes.

---

### Delete CV
`DELETE /cv/:id`

**Response**
```json
{ "success": true, "data": { "deleted": true } }
```

---

## AI Features

### AI Assistant
`POST /ai`

Single actions for enhancing CV sections. Returns plain text (not streaming).

**Body**
```json
{
  "action": "generate_summary",
  "context": {
    "jobTitle": "مطور Full Stack",
    "experiences": "Careem, OCP...",
    "skills": "React, Node.js",
    "market": "مغربي",
    "lang": "ar"
  }
}
```

**Available actions**

| action | required context keys |
|---|---|
| `generate_summary` | `jobTitle`, `experiences`, `skills`, `market`, `lang` |
| `improve_summary` | `summary`, `jobTitle`, `lang` |
| `improve_experience` | `jobTitle`, `company`, `description`, `lang` |
| `suggest_skills` | `jobTitle`, `currentSkills` |
| `full_review` | `name`, `jobTitle`, `summary`, `experiences`, `skills` |
| `translate_to_en` | `text`, `fieldType` |
| `translate_to_ar` | `text`, `fieldType` |

**Response**
```json
{ "success": true, "data": { "result": "مطور برمجيات متخصص في بناء تطبيقات ويب...", "action": "generate_summary" } }
```

---

### Generate CV from Description
`POST /cv/generate`

Takes a free-text description (Arabic, English, or mixed) and returns a complete CVData object.

**Body**
```json
{ "description": "أنا مطور Full Stack عندي 5 سنين خبرة في React و Node.js...", "lang": "ar" }
```

**Response**
```json
{
  "success": true,
  "data": {
    "cv": {
      "personal": { "fullName": "...", "fullNameEn": "...", "jobTitle": "...", ... },
      "experience": [ ... ],
      "education": [ ... ],
      "skills": [ ... ],
      "languages": [ ... ],
      "template": "tech",
      "cvMode": "bilingual",
      ...
    }
  }
}
```

Typical response time: 10–20 seconds.

---

### Tailor CV for Job
`POST /cv/tailor`

Takes an existing CVData and a job description. Rewrites and optimizes the CV for that specific role without inventing new information.

**Body**
```json
{
  "cv": { ...CVData object... },
  "jobDescription": "We are looking for a Senior React Developer...",
  "jobTitle": "Senior React Developer",
  "company": "Careem"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "cv": { ...tailored CVData... },
    "changes": [
      { "field": "summary", "reason": "Emphasized React and TypeScript to match requirements" },
      { "field": "skills", "reason": "Reordered to prioritize React, TypeScript, GraphQL" }
    ],
    "matchScore": 87,
    "missingSkills": ["Docker", "Kubernetes"],
    "jobKeywords": ["React", "TypeScript", "GraphQL", "REST APIs"]
  }
}
```

Typical response time: 15–25 seconds.

---

## Payments

### Create Checkout Session
`POST /payment`

Opens a Stripe Checkout session. The mobile app should open the `url` in a WebView or in-app browser.

**Body**
```json
{ "plan": "BASIC" }
```

Plans: `BASIC` ($7 one-time) · `PRO` ($15/month)

**Response**
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_...",
    "sessionId": "cs_..."
  }
}
```

After payment completes, Stripe calls the webhook which upgrades the user's plan in the database. The mobile app can poll `GET /payment/status` or `GET /auth/me` to detect the upgrade.

---

### Get Plan Status
`GET /payment/status`

**Response**
```json
{
  "success": true,
  "data": {
    "plan": "BASIC",
    "canDownloadPDF": true,
    "canUseBilingualMode": true,
    "canUseAllTemplates": true,
    "payments": [
      { "id": "pay_...", "amount": 700, "currency": "usd", "plan": "BASIC", "createdAt": "..." }
    ]
  }
}
```

---

## Error Reference

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or expired token |
| `MISSING_FIELDS` | 400 | Required body fields absent |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `WEAK_PASSWORD` | 400 | Password under 8 chars |
| `INVALID_EMAIL` | 400 | Malformed email |
| `NOT_FOUND` | 404 | Resource doesn't exist or belongs to another user |
| `MISSING_DATA` | 400 | CV data object missing |
| `INVALID_PLAN` | 400 | Plan not BASIC or PRO |
| `AI_ERROR` | 502 | Anthropic API unavailable |
| `PARSE_ERROR` | 500 | AI returned malformed JSON |
| `SERVER_ERROR` | 500 | Unexpected server error |

---

## CVData Schema

The `data` field in all CV endpoints follows this TypeScript structure:

```typescript
interface CVData {
  personal: {
    fullName: string;       // Arabic name
    fullNameEn?: string;    // English name
    jobTitle: string;
    jobTitleEn?: string;
    email: string;
    phone: string;
    location: string;
    locationEn?: string;
    website?: string;
    linkedin?: string;
    summary: string;        // Arabic summary
    summaryEn?: string;     // English summary
    photo?: string;         // base64 or URL
    nationality?: string;
    dateOfBirth?: string;
    maritalStatus?: string;
    visaStatus?: string;
  };
  experience: {
    id: string;
    jobTitle: string;
    jobTitleEn?: string;
    company: string;
    companyEn?: string;
    location?: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    descriptionEn?: string;
  }[];
  education: {
    id: string;
    degree: string;
    degreeEn?: string;
    field: string;
    fieldEn?: string;
    institution: string;
    institutionEn?: string;
    endDate: string;
    gpa?: string;
  }[];
  skills: { id: string; name: string; level: string }[];
  languages: { id: string; name: string; level: string }[];
  certificates: { id: string; name: string; issuer?: string; date?: string }[];
  template: 'golden' | 'casablanca' | 'gulf' | 'minimal' | 'tech';
  language: 'ar' | 'en' | 'fr';
  cvMode: 'ar' | 'en' | 'bilingual';
  country: 'MA' | 'AE' | 'SA' | 'EG' | 'QA' | 'KW' | 'DZ' | 'TN';
}
```

---

## Quick Start (React Native / Flutter)

```typescript
// 1. Login
const { data } = await fetch('https://seerti.ai/api/mobile/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
}).then(r => r.json())

const token = data.token  // store in SecureStore / Keychain

// 2. Fetch CVs
const { data: cvData } = await fetch('https://seerti.ai/api/mobile/cv', {
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json())

// 3. Save CV
await fetch('https://seerti.ai/api/mobile/cv', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'My CV', data: cvData }),
})

// 4. Generate from description
const { data: generated } = await fetch('https://seerti.ai/api/mobile/cv/generate', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ description: 'Software engineer with 5 years...', lang: 'en' }),
}).then(r => r.json())

// 5. Tailor for job
const { data: tailored } = await fetch('https://seerti.ai/api/mobile/cv/tailor', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ cv: generated.cv, jobDescription: '...', jobTitle: 'Senior Dev' }),
}).then(r => r.json())
```
