# Firebase Migration Guide

This document provides patterns for converting Supabase code to Firebase/Firestore.

## Files Still Needing Conversion

1. ✅ `src/lib/questionQueueManager.ts` - COMPLETED
2. `src/pages/InterviewSetup.tsx`
3. `src/pages/ManualMockInterview.tsx`
4. `src/pages/Dashboard.tsx`
5. `src/pages/HRDashboard.tsx`
6. `src/pages/AdminDashboard.tsx`
7. `src/pages/Report.tsx`
8. `src/pages/SharedReport.tsx`
9. `src/pages/InterviewRoom.tsx`
10. `src/pages/InterviewRoomV2.tsx`

## Import Changes

### Supabase (Old)
```typescript
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
```

### Firebase (New)
```typescript
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
```

## Common Operation Patterns

### 1. Insert Data

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('sessions')
  .insert({
    user_id: userId,
    role: role,
    experience_level: level
  })
  .select()
  .single();
```

**Firebase:**
```typescript
const sessionRef = await addDoc(collection(db, 'sessions'), {
  userId: userId,
  role: role,
  experienceLevel: level,
  createdAt: Timestamp.now()
});
const sessionId = sessionRef.id;
```

### 2. Query Single Document

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle();
```

**Firebase:**
```typescript
const userDocRef = doc(db, 'users', userId);
const userDoc = await getDoc(userDocRef);
if (userDoc.exists()) {
  const data = userDoc.data();
}
```

### 3. Query Multiple Documents with Filters

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

**Firebase:**
```typescript
const sessionsQuery = query(
  collection(db, 'sessions'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
);
const querySnapshot = await getDocs(sessionsQuery);
const sessions = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### 4. Update Document

**Supabase:**
```typescript
const { error } = await supabase
  .from('users')
  .update({
    name: name,
    bio: bio,
    updated_at: new Date().toISOString()
  })
  .eq('id', userId);
```

**Firebase:**
```typescript
const userDocRef = doc(db, 'users', userId);
await updateDoc(userDocRef, {
  name: name,
  bio: bio,
  updatedAt: Timestamp.now()
});
```

### 5. Delete Document

**Supabase:**
```typescript
const { error } = await supabase
  .from('sessions')
  .delete()
  .eq('id', sessionId);
```

**Firebase:**
```typescript
const sessionDocRef = doc(db, 'sessions', sessionId);
await deleteDoc(sessionDocRef);
```

### 6. Real-time Subscription

**Supabase:**
```typescript
const channel = supabase
  .channel('mock_interview_requests_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'mock_interview_requests' },
    (payload) => {
      console.log('Change received!', payload);
      loadRequests();
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
```

**Firebase:**
```typescript
const requestsQuery = query(collection(db, 'mockInterviewRequests'));
const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
      console.log('Change received!', change.type);
      loadRequests();
    }
  });
});

return () => {
  unsubscribe();
};
```

### 7. Complex Queries with Multiple Conditions

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('mock_interview_requests')
  .select(`
    *,
    users!mock_interview_requests_user_id_fkey(name, email),
    hr_users:users!mock_interview_requests_claimed_by_fkey(name, email)
  `)
  .eq('status', 'approved')
  .eq('booking_status', 'open')
  .order('created_at', { ascending: false });
```

**Firebase (requires separate queries for joins):**
```typescript
// First query: Get requests
const requestsQuery = query(
  collection(db, 'mockInterviewRequests'),
  where('status', '==', 'approved'),
  where('bookingStatus', '==', 'open'),
  orderBy('createdAt', 'desc')
);
const requestsSnapshot = await getDocs(requestsQuery);

// Then fetch related user data
const requests = await Promise.all(
  requestsSnapshot.docs.map(async (requestDoc) => {
    const requestData = requestDoc.data();

    // Fetch user data
    const userDocRef = doc(db, 'users', requestData.userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Fetch HR user data if claimed
    let hrUserData = null;
    if (requestData.claimedBy) {
      const hrUserDocRef = doc(db, 'users', requestData.claimedBy);
      const hrUserDoc = await getDoc(hrUserDocRef);
      hrUserData = hrUserDoc.exists() ? hrUserDoc.data() : null;
    }

    return {
      id: requestDoc.id,
      ...requestData,
      user: userData,
      hrUser: hrUserData
    };
  })
);
```

### 8. Count Documents

**Supabase:**
```typescript
const { count, error } = await supabase
  .from('sessions')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);
```

**Firebase:**
```typescript
import { getCountFromServer } from 'firebase/firestore';

const sessionsQuery = query(
  collection(db, 'sessions'),
  where('userId', '==', userId)
);
const snapshot = await getCountFromServer(sessionsQuery);
const count = snapshot.data().count;
```

## Field Name Conventions

Supabase uses snake_case, Firebase typically uses camelCase:

| Supabase Field | Firebase Field |
|----------------|----------------|
| `user_id` | `userId` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `resume_url` | `resumeUrl` |
| `is_approved` | `isApproved` |
| `job_role` | `jobRole` |
| `experience_level` | `experienceLevel` |
| `job_description` | `jobDescription` |
| `booking_status` | `bookingStatus` |
| `claimed_by` | `claimedBy` |
| `scheduled_date` | `scheduledDate` |
| `preferred_date` | `preferredDate` |
| `preferred_time` | `preferredTime` |
| `additional_notes` | `additionalNotes` |
| `overall_score` | `overallScore` |
| `performance_breakdown` | `performanceBreakdown` |
| `suggested_topics` | `suggestedTopics` |
| `share_id` | `shareId` |
| `pdf_url` | `pdfUrl` |
| `queue_state` | `queueState` |
| `current_question_number` | `currentQuestionNumber` |
| `answer_text` | `answerText` |
| `answer_audio_url` | `answerAudioUrl` |
| `voice_metrics` | `voiceMetrics` |
| `body_metrics` | `bodyMetrics` |
| `eval_json` | `evalJson` |
| `question_number` | `questionNumber` |
| `identified_weaknesses` | `identifiedWeaknesses` |
| `share_token` | `shareToken` |
| `expires_at` | `expiresAt` |
| `view_count` | `viewCount` |
| `action_type` | `actionType` |
| `request_id` | `requestId` |
| `parsed_data` | `parsedData` |

## Authentication Changes

### Get Current User

**Supabase:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;
```

**Firebase:**
```typescript
import { useAuth } from '../contexts/AuthContext';

const { user } = useAuth();
const userId = user?.uid;
```

## Error Handling

**Supabase:**
```typescript
const { data, error } = await supabase.from('users').select('*');
if (error) {
  console.error('Error:', error);
  return;
}
```

**Firebase:**
```typescript
try {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} catch (error) {
  console.error('Error:', error);
}
```

## Timestamp Handling

**Supabase:**
```typescript
created_at: new Date().toISOString()
```

**Firebase:**
```typescript
import { Timestamp } from 'firebase/firestore';

createdAt: Timestamp.now()
```

## Composite Indexes Required

For queries with multiple where clauses or orderBy, create composite indexes in Firebase Console:

1. `mockInterviewRequests`: `status` + `bookingStatus`
2. `sessions`: `userId` + `createdAt`
3. `reports`: `userId` + `createdAt`
4. `turns`: `sessionId` + `timestamp`

## Testing Each Conversion

After updating each file:

1. Run `npm run build` to check for TypeScript errors
2. Test the specific functionality in the browser
3. Check Firebase Console for data structure
4. Verify real-time listeners work correctly

## Priority Order for Conversion

1. ✅ `questionQueueManager.ts` - Core library
2. `InterviewSetup.tsx` - Entry point for interviews
3. `ManualMockInterview.tsx` - Request submission
4. `Dashboard.tsx` - Main user dashboard
5. `HRDashboard.tsx` - HR management (has real-time listeners)
6. `AdminDashboard.tsx` - Admin panel
7. `Report.tsx` - Report viewing
8. `SharedReport.tsx` - Public report sharing
9. `InterviewRoom.tsx` - Legacy interview room
10. `InterviewRoomV2.tsx` - Current interview room

## Notes

- Firebase doesn't support joins like Supabase, so related data requires separate queries
- Use `onSnapshot` for real-time updates instead of Supabase channels
- All document IDs are auto-generated unless specified
- Timestamps should use `Timestamp.now()` not ISO strings
- Remember to update security rules in Firebase Console after schema changes
