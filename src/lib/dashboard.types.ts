export interface HRFeedback {
    overall_rating: number;
    communication: string;
    technical_knowledge: string;
    problem_solving: string;
    cultural_fit: string;
    key_strengths: string;
    areas_for_improvement: string;
    hire_recommendation: string;
    private_notes: string;
    interview_description: string;
}

export interface AIReport {
    executive_summary: string;
    performance_analysis: string;
    key_strengths: string[];
    development_areas: string[];
    hire_recommendation: string;
    coaching_suggestions: string[];
    report_generated_at: string;
}

export interface MockInterviewRequest {
    id: string;
    ticket_number: string;
    user_id: string;
    job_role: string;
    company_name: string | null;
    experience_level: string;
    job_description: string;
    additional_notes: string;
    interview_description?: string;
    status: string;
    booking_status: string;
    assigned_hr_id: string | null;
    claimed_by: string | null;
    claimed_at?: any;
    preferred_date: string;
    preferred_time: string;
    scheduled_date: string | null;
    scheduled_time: string | null;
    meeting_room_link: string | null;
    created_at: any;
    candidate_info: {
        name: string;
        email: string;
        bio: string;
        experience_level: string;
        industry: string;
        career_goals: string;
        resume_url: string | null;
    } | null;
    users: {
        name: string;
        email: string;
    };
    hr_feedback?: HRFeedback;
    ai_report?: AIReport;
}
