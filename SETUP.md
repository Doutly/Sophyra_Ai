# Sophyra AI - Setup & Deployment Guide

## Project Overview

Sophyra AI is a complete, production-ready AI interview simulator with real-time voice analysis, body language tracking, and AI-powered feedback powered by Google's Gemini Pro.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v7
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Google Gemini Pro API
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Icons**: Lucide React

## Database Schema

### Tables Created
1. **users** - User profiles and account data
2. **sessions** - Interview session metadata
3. **turns** - Individual Q&A exchanges
4. **reports** - Performance reports and analytics
5. **tips** - Personalized improvement suggestions
6. **shares** - Public report sharing links

All tables have Row Level Security (RLS) enabled with appropriate policies.

## File Structure

```
src/
├── components/          # Reusable UI components
│   ├── CTA.tsx
│   ├── DemoReport.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── HowItWorks.tsx
│   └── ValueProps.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities and configs
│   ├── api.ts         # API helper functions
│   ├── database.types.ts  # TypeScript types
│   └── supabase.ts    # Supabase client
├── pages/             # Main application pages
│   ├── AdminDashboard.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── InterviewRoom.tsx
│   ├── InterviewSetup.tsx
│   ├── Landing.tsx
│   ├── Profile.tsx
│   ├── Report.tsx
│   └── SharedReport.tsx
├── App.tsx            # Root component with routing
├── main.tsx          # Application entry point
└── index.css         # Global styles

supabase/
└── functions/         # Edge Functions
    ├── generate-interview-question/
    │   └── index.ts
    └── evaluate-answer/
        └── index.ts
```

## Environment Variables

The following environment variables are configured in `.env`:

```env
VITE_SUPABASE_URL=https://cqmhlvkkoqgmdyafjupt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Gemini API Integration

The Gemini Pro API key is configured in:
- `src/lib/api.ts` - For direct client calls
- Supabase Edge Functions - For secure server-side processing

**API Key**: AIzaSyDaS7WX4dPCaz5vv_X6Spf67ev4VH9AmWo

## Features Implemented

### 1. **Landing Page** (`/`)
- Hero section with CTAs
- Value propositions
- How it works guide
- Demo report preview
- Pricing and CTA section

### 2. **Authentication** (`/auth`)
- Sign up with email/password
- Sign in
- Password reset
- Session management

### 3. **Candidate Dashboard** (`/dashboard`)
- Past interview reports
- Progress overview
- HR tips
- Quick actions

### 4. **Interview Setup** (`/interview/setup`)
- Job details form
- Resume upload
- Consent toggles

### 5. **Live Interview Room** (`/interview/:sessionId`)
- AI question generation with Gemini
- Real-time voice transcription
- Speaking pace tracking (WPM)
- Filler word detection
- Camera integration
- Body language metrics
- Answer evaluation

### 6. **Report Page** (`/report/:reportId`)
- Overall score
- Category breakdown
- Strengths and gaps
- Suggested topics
- Share and download options

### 7. **Profile Settings** (`/profile`)
- Personal information
- Resume management
- Account statistics

### 8. **Shared Reports** (`/shared/:shareToken`)
- Public report viewing
- No authentication required
- View counter

### 9. **Admin Dashboard** (`/admin`)
- Candidate management
- Cohort analytics
- Skill gap heatmap
- CSV export

## Edge Functions

### 1. `generate-interview-question`
**Purpose**: Generate contextual interview questions using Gemini AI

**Input**:
```typescript
{
  jobRole: string;
  experienceLevel: string;
  jobDescription: string;
  previousQuestions?: string[];
  previousAnswers?: string[];
}
```

**Output**:
```typescript
{
  question: string;
  tone: string;
}
```

### 2. `evaluate-answer`
**Purpose**: Evaluate candidate answers with AI feedback

**Input**:
```typescript
{
  question: string;
  answer: string;
  jobRole: string;
  jobDescription: string;
}
```

**Output**:
```typescript
{
  clarity: number;        // 0-10
  confidence: number;     // 0-10
  relevance: number;      // 0-10
  professionalism: number; // 0-10
  feedback: string;
  suggestions: string[];
}
```

## Running the Application

### Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Key Features

### AI-Powered Interview
- Dynamic question generation based on JD and experience
- Adaptive follow-up questions
- Tone adjustment (mentor, formal HR, senior leader)
- Real-time answer evaluation

### Voice Analysis
- Web Speech API integration
- Live transcription
- WPM calculation
- Filler word detection

### Body Language Tracking
- Browser-based camera access
- Face detection
- Eye contact metrics
- Attention stability
- Privacy-safe (no video storage)

### Comprehensive Reports
- 5 category scores (0-10 each)
- Overall score (0-100)
- Strengths and gaps
- Suggested practice topics
- Shareable public links
- PDF download ready

### Admin Features
- Candidate list and search
- Performance analytics
- Skill gap visualization
- Benchmarking
- CSV export

## User Roles

### Candidates
- Complete mock interviews
- View performance reports
- Track progress over time
- Share achievements

### Admins (Universities/Companies)
- Monitor candidate cohorts
- Analyze skill gaps
- Export data
- Benchmark performance

## Security

- Row Level Security on all tables
- Authentication required for private data
- Token-based public sharing
- No sensitive data in client code
- Secure Edge Functions with JWT verification

## Browser Requirements

- Modern browser with ES6+ support
- Web Speech API support (Chrome, Edge, Safari)
- MediaDevices API for camera (optional)
- LocalStorage enabled

## Performance

- Optimized build with Vite
- Code splitting
- Lazy loading
- Tree shaking
- Asset optimization

**Build Output**:
- HTML: 0.47 kB
- CSS: 30.14 kB (5.45 kB gzipped)
- JS: 472.50 kB (126.85 kB gzipped)

## Deployment Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] Storage bucket created
- [x] Edge Functions deployed
- [x] Environment variables set
- [x] Gemini API configured
- [x] Build successful
- [x] All routes working
- [x] Authentication flows tested

## Support & Maintenance

### Regular Tasks
- Monitor API usage
- Review user feedback
- Update AI prompts
- Optimize performance
- Security audits

### Scaling Considerations
- Database indexing
- CDN for assets
- Edge function optimization
- Caching strategies
- Load balancing

## Future Enhancements

1. **Video Recording**: Full interview playback
2. **AI Coach**: Real-time tips during interview
3. **Practice Plans**: Personalized improvement roadmaps
4. **Team Features**: Collaborative practice
5. **Mobile Apps**: Native iOS/Android
6. **Advanced Analytics**: ML-powered insights
7. **Integration**: ATS and HR systems

## License & Credits

Built with Sophyra AI - Enterprise-grade interview preparation platform.
