import * as React from "react";
import { motion } from "framer-motion";
import { Clock, ClipboardCopy, CheckCircle, QrCode, Play, Calendar, Briefcase, Building2, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface InterviewRequestCardProps {
  candidateName: string;
  jobRole: string;
  companyName?: string | null;
  ticketNumber: string;
  status: "pending" | "approved" | "rejected" | "completed";
  bookingStatus?: string;
  meetingLink?: string | null;
  preferredDate: string;
  preferredTime: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  interviewUrl: string;
  onStartInterview?: () => void;
  className?: string;
}

const InfoItem = ({
  label,
  value,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
      <span className="font-semibold text-sm text-slate-800 truncate">{value}</span>
      {children}
    </div>
  </div>
);

const statusConfig = {
  pending: { label: "Pending Review", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", classes: "bg-red-50 text-red-700 border-red-200" },
  completed: { label: "Completed", classes: "bg-slate-100 text-slate-600 border-slate-200" },
};

export const InterviewRequestCard = ({
  candidateName,
  jobRole,
  companyName,
  ticketNumber,
  status,
  bookingStatus,
  meetingLink,
  preferredDate,
  preferredTime,
  scheduledDate,
  scheduledTime,
  interviewUrl,
  onStartInterview,
  className,
}: InterviewRequestCardProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const cfg = statusConfig[status];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(interviewUrl)}&size=120x120&margin=4&color=1e293b&bgcolor=f8fafc`;

  const displayDate = scheduledDate || preferredDate;
  const displayTime = scheduledTime || preferredTime;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isBooked = bookingStatus === "booked";
  const hasMeetingLink = isBooked && !!meetingLink;
  const isWaitingForSchedule = status === "approved" && !isBooked;

  const handleStartInterview = () => {
    if (hasMeetingLink) {
      window.open(meetingLink!, "_blank", "noopener,noreferrer");
    } else if (onStartInterview) {
      onStartInterview();
    }
  };

  const getButtonConfig = () => {
    if (status === "rejected") {
      return {
        label: "Request Rejected",
        icon: null,
        disabled: true,
        className: "bg-slate-100 text-slate-400 cursor-not-allowed",
      };
    }
    if (hasMeetingLink) {
      return {
        label: "Join Interview",
        icon: ExternalLink,
        disabled: false,
        className: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20",
      };
    }
    if (isBooked && !meetingLink) {
      return {
        label: "Meeting Not Yet Scheduled",
        icon: Clock,
        disabled: true,
        className: "bg-slate-100 text-slate-400 cursor-not-allowed",
      };
    }
    if (status === "approved") {
      return {
        label: "Start Interview",
        icon: Play,
        disabled: false,
        className: "bg-brand-electric text-white hover:bg-brand-electric-dark shadow-sm shadow-blue-500/20",
      };
    }
    return {
      label: "Start Interview",
      icon: Play,
      disabled: true,
      className: "bg-slate-800 text-white hover:bg-slate-900",
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
      className={cn("w-full", className)}
    >
      <div className="w-full rounded-2xl shadow-md border border-slate-100 overflow-hidden bg-white">
        <div className="p-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{candidateName}</p>
                <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold mt-1", cfg.classes)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {cfg.label}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src={qrUrl}
                alt="Scan to start interview"
                className="h-16 w-16 rounded-lg border border-slate-200 shadow-sm"
              />
              <p className="text-[9px] text-slate-400 text-center mt-1 font-medium">Scan to start</p>
            </div>
          </div>

          {hasMeetingLink && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                <span>Scheduled:</span>
                <span>{formatDate(displayDate)}</span>
                {displayTime && <span>at {displayTime}</span>}
              </div>
            </div>
          )}

          {isWaitingForSchedule && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <Clock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-[11px] text-amber-700 font-semibold">
                Approved — waiting for HR to schedule your meeting
              </p>
            </div>
          )}

          {isBooked && !meetingLink && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <AlertCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-[11px] text-blue-700 font-semibold">
                Interview scheduled — meeting link coming soon
              </p>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="Job Role" value={jobRole} icon={Briefcase} />
            <InfoItem label="Company" value={companyName || "Not specified"} icon={Building2} />
            <InfoItem label="Preferred Date" value={formatDate(preferredDate)} icon={Calendar} />
            <InfoItem label="Preferred Time" value={preferredTime || "Flexible"} icon={Clock} />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <InfoItem label="Ticket Number" value={ticketNumber} icon={QrCode}>
              <button
                onClick={handleCopy}
                className="ml-auto p-1 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
                aria-label="Copy ticket number"
              >
                {copied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ClipboardCopy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
            </InfoItem>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleStartInterview}
            disabled={buttonConfig.disabled}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              buttonConfig.className
            )}
          >
            {buttonConfig.icon && <buttonConfig.icon className="h-3.5 w-3.5" />}
            {buttonConfig.label}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
