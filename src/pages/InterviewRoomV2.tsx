import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Power, Phone, PhoneOff } from 'lucide-react';
import { createInterviewAgent, ElevenLabsInterviewAgent, InterviewContext } from '../lib/elevenLabsAgent';

export default function InterviewRoomV2() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');

  const agentRef = useRef<ElevenLabsInterviewAgent | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    loadSession();

    return () => {
      if (agentRef.current) {
        agentRef.current.destroy();
      }
    };
  }, [user, sessionId, navigate]);

  const loadSession = async () => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId!);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        throw new Error('Session not found');
      }

      const data = sessionSnap.data();
      setSession(data);

      await initializeAgent(data);

      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('/dashboard');
    }
  };

  const initializeAgent = async (sessionData: any) => {
    try {
      const context: InterviewContext = {
        candidateName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Candidate',
        jobRole: sessionData.role,
        experienceLevel: sessionData.experience_level,
        jobDescription: sessionData.jd_text || 'General interview questions',
        companyName: sessionData.company || 'Our company',
        resumeData: sessionData.resume_data ? {
          skills: sessionData.resume_data.skills || [],
          experience: sessionData.resume_data.experience || '',
          education: sessionData.resume_data.education || '',
        } : undefined,
      };

      const agent = createInterviewAgent({
        agentId: 'agent_6401kf6a3faqejpbsks4a5h1j3da',
        context,
        onCallStart: handleCallStart,
        onCallEnd: handleCallEnd,
      });

      await agent.initialize();
      agentRef.current = agent;

      console.log('Interview agent initialized');
    } catch (error) {
      console.error('Failed to initialize agent:', error);
    }
  };

  const handleCallStart = async () => {
    setCallActive(true);
    setCallStatus('active');
    console.log('Call started');

    try {
      const sessionRef = doc(db, 'sessions', sessionId!);
      await updateDoc(sessionRef, {
        started_at: Timestamp.now(),
        status: 'in_progress',
      });
    } catch (error) {
      console.error('Error updating session start:', error);
    }
  };

  const handleCallEnd = async () => {
    setCallActive(false);
    setCallStatus('ended');
    console.log('Call ended');

    try {
      const sessionRef = doc(db, 'sessions', sessionId!);
      await updateDoc(sessionRef, {
        ended_at: Timestamp.now(),
        status: 'completed',
        completed_at: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating session end:', error);
    }

    setTimeout(() => {
      navigate(`/report/${sessionId}`);
    }, 2000);
  };

  const startInterview = async () => {
    if (!agentRef.current) {
      console.error('Agent not initialized');
      return;
    }

    setCallStatus('connecting');

    try {
      await agentRef.current.startInterview();
    } catch (error) {
      console.error('Failed to start interview:', error);
      setCallStatus('idle');
    }
  };

  const endInterviewEarly = async () => {
    if (confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
      if (agentRef.current) {
        await agentRef.current.endInterview();
      }
      await handleCallEnd();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Emergency exit button */}
      {callActive && (
        <button
          onClick={endInterviewEarly}
          className="fixed top-6 right-6 z-50 p-3 bg-gray-800/80 hover:bg-red-500/20 border border-gray-700 hover:border-red-500 rounded-full backdrop-blur-sm transition-all group"
          title="End Interview"
        >
          <Power className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
        </button>
      )}

      {/* Main Interview Interface */}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-gradient-to-br from-brand-electric to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-electric/50">
                <Phone className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Interview with Sarah</h1>
              <p className="text-gray-400">
                {session?.role} - {session?.experience_level}
              </p>
            </div>

            {/* Status Display */}
            <div className="mb-8">
              {callStatus === 'idle' && (
                <div className="text-center">
                  <p className="text-gray-300 mb-6">
                    Ready to start your interview? Click the button below to begin your conversation with Sarah, your AI interviewer.
                  </p>
                  <button
                    onClick={startInterview}
                    className="w-full py-4 bg-gradient-to-r from-brand-electric to-blue-500 text-white font-semibold rounded-xl hover:from-brand-electric-dark hover:to-blue-600 transition-all shadow-lg shadow-brand-electric/30 flex items-center justify-center space-x-3"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Start Interview Call</span>
                  </button>
                </div>
              )}

              {callStatus === 'connecting' && (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-brand-electric-light font-medium">Connecting to Sarah...</p>
                </div>
              )}

              {callStatus === 'active' && (
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 rounded-full bg-brand-electric/20 animate-ping"></div>
                    <div className="w-32 h-32 bg-gradient-to-br from-brand-electric to-blue-500 rounded-full flex items-center justify-center relative">
                      <Phone className="w-16 h-16 text-white animate-pulse" />
                    </div>
                  </div>
                  <p className="text-brand-electric-light font-medium text-xl mb-2">Interview In Progress</p>
                  <p className="text-gray-400 text-sm">Speaking with Sarah...</p>
                </div>
              )}

              {callStatus === 'ended' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PhoneOff className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-300 font-medium mb-2">Interview Completed</p>
                  <p className="text-gray-500 text-sm">Generating your report...</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            {callStatus === 'idle' && (
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-white font-semibold mb-3">What to Expect:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-brand-electric-light mt-1">•</span>
                    <span>Sarah will ask you 8 questions about the {session?.role} role</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-brand-electric-light mt-1">•</span>
                    <span>Answer naturally - this is a conversation, not a test</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-brand-electric-light mt-1">•</span>
                    <span>The interview typically lasts 15-20 minutes</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-brand-electric-light mt-1">•</span>
                    <span>You'll receive a detailed performance report at the end</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden ElevenLabs Widget */}
      <div id="elevenlabs-widget-container" className="hidden"></div>
    </div>
  );
}
