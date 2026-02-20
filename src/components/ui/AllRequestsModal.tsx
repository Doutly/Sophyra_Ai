import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket } from "lucide-react";
import { InterviewRequestCard } from "./interview-request-card";

interface MockInterviewRequest {
  id: string;
  ticket_number: string;
  job_role: string;
  company_name: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  booking_status: string;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  meeting_room_link: string | null;
}

interface AllRequestsModalProps {
  requests: MockInterviewRequest[];
  candidateName: string;
  onClose: () => void;
  onStartInterview: (request: MockInterviewRequest) => void;
}

export const AllRequestsModal = ({
  requests,
  candidateName,
  onClose,
  onStartInterview,
}: AllRequestsModalProps) => {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                <Ticket className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">All Interview Requests</h2>
                <p className="text-xs text-slate-400 mt-0.5">{requests.length} {requests.length === 1 ? "request" : "requests"} total</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((request) => (
                <InterviewRequestCard
                  key={request.id}
                  candidateName={candidateName}
                  jobRole={request.job_role}
                  companyName={request.company_name}
                  ticketNumber={request.ticket_number}
                  status={request.status}
                  bookingStatus={request.booking_status}
                  meetingLink={request.meeting_room_link}
                  preferredDate={request.preferred_date}
                  preferredTime={request.preferred_time}
                  scheduledDate={request.scheduled_date}
                  scheduledTime={request.scheduled_time}
                  interviewUrl={`${window.location.origin}/interview/setup?ticket=${request.ticket_number}`}
                  onStartInterview={() => onStartInterview(request)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
