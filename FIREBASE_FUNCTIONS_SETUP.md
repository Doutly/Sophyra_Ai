# Firebase Cloud Functions Setup Guide

This guide explains how to set up and deploy Firebase Cloud Functions for your application.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project upgraded to Blaze (pay-as-you-go) plan
3. Logged in to Firebase: `firebase login`

## Setup Steps

### 1. Initialize Firebase Functions

```bash
firebase init functions
```

Select the following options:
- Use existing project: `sophyraai`
- Language: TypeScript
- ESLint: Yes (optional)
- Install dependencies: Yes

### 2. Configure Environment Variables

Set the Gemini API key for your functions:

```bash
firebase functions:config:set gemini.api_key="AIzaSyDaS7WX4dPCaz5vv_X6Spf67ev4VH9AmWo"
```

### 3. Replace Functions Code

Replace the content of `functions/src/index.ts` with:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const GEMINI_API_KEY = functions.config().gemini.api_key;

export const generateInterviewQuestion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {
    jobRole,
    experienceLevel,
    jobDescription,
    previousQuestions = [],
    previousAnswers = [],
    instructions = ''
  } = data;

  try {
    const tone = experienceLevel === 'fresher' ? 'supportive mentor' :
                 experienceLevel === '6+' ? 'calm senior leader' :
                 'formal HR';

    const context = `You are interviewing for: ${jobRole}\nExperience Level: ${experienceLevel}\nJob Description: ${jobDescription}`;

    let prompt = `${context}\n\n${instructions}\n\n`;
    prompt += `Generate ONE specific, relevant interview question for this candidate. `;
    prompt += `Use a ${tone} tone. `;
    prompt += `Keep the question concise (1-2 sentences max). `;
    prompt += `\n\nReturn ONLY the question text, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const result = await response.json();
    const question = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return { question, tone };
  } catch (error) {
    console.error('Error generating question:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate question');
  }
});

export const evaluateAnswer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { question, answer, jobRole, jobDescription } = data;

  try {
    const prompt = `Evaluate the following interview answer:

Question: ${question}
Answer: ${answer}
Job Role: ${jobRole}
Job Description: ${jobDescription}

Rate the answer on these metrics (1-10):
- Clarity: How well-structured and easy to understand
- Confidence: Tone and assertiveness
- Relevance: Alignment with question and role
- Professionalism: Communication quality

Provide:
1. Scores for each metric
2. Brief feedback (2-3 sentences)
3. 2 specific improvement suggestions

Format as JSON:
{
  "clarity": number,
  "confidence": number,
  "relevance": number,
  "professionalism": number,
  "feedback": "string",
  "suggestions": ["string", "string"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      clarity: 7,
      confidence: 7,
      relevance: 7,
      professionalism: 8,
      feedback: "Your answer demonstrates good understanding.",
      suggestions: [
        "Use the STAR method for behavioral questions",
        "Include quantifiable metrics when discussing achievements"
      ]
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw new functions.https.HttpsError('internal', 'Failed to evaluate answer');
  }
});

export const parseResume = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { fileData } = data;

  try {
    const prompt = `Parse the following resume and extract structured data:

${fileData}

Return JSON with:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "experience": [{"company": "string", "role": "string", "duration": "string", "description": "string"}],
  "education": [{"degree": "string", "institution": "string", "year": "string"}],
  "summary": "string"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse resume');
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new functions.https.HttpsError('internal', 'Failed to parse resume');
  }
});
```

### 4. Update package.json in functions directory

Make sure `functions/package.json` includes:

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  }
}
```

### 5. Deploy Functions

```bash
firebase deploy --only functions
```

## Testing Functions Locally

You can test functions locally before deploying:

```bash
cd functions
npm run serve
```

## Important Notes

- The Blaze plan is required for external API calls (Gemini)
- First 2 million function invocations per month are free
- Monitor usage in Firebase Console
- Functions automatically authenticate using Firebase Auth tokens

## Firestore Security Rules

Deploy these security rules in Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isHROrAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['hr', 'admin'];
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId);
    }

    match /sessions/{sessionId} {
      allow read, write: if isOwner(resource.data.userId) || isAdmin();
    }

    match /turns/{turnId} {
      allow read, write: if isAuthenticated();
    }

    match /reports/{reportId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow write: if isOwner(resource.data.userId);
    }

    match /tips/{tipId} {
      allow read, write: if isOwner(resource.data.userId);
    }

    match /shares/{shareId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }

    match /mockInterviewRequests/{requestId} {
      allow read: if isOwner(resource.data.userId) || isHROrAdmin();
      allow create: if isAuthenticated();
      allow update: if isHROrAdmin();
    }

    match /adminActions/{actionId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    match /resumeData/{dataId} {
      allow read, write: if isOwner(resource.data.userId);
    }
  }
}
```

## Firebase Storage Rules

Deploy these storage rules in Firebase Console:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /resumes/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    match /interview-assets/{allPaths=**} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}
```

## Required Indexes

Create these composite indexes in Firestore:

1. Collection: `mockInterviewRequests`
   - Fields: `status` (Ascending), `bookingStatus` (Ascending)

2. Collection: `sessions`
   - Fields: `userId` (Ascending), `createdAt` (Descending)

3. Collection: `reports`
   - Fields: `userId` (Ascending), `createdAt` (Descending)

## Troubleshooting

If functions fail to deploy:
1. Ensure you're on the Blaze plan
2. Check that environment variables are set correctly
3. Verify Firebase CLI is up to date: `npm update -g firebase-tools`
4. Check logs: `firebase functions:log`
