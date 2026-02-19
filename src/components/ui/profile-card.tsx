import * as React from "react";
import { motion } from "framer-motion";
import { Star, Edit3, BarChart2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  title: string;
  avatarSrc?: string;
  bannerSrc?: string;
  interviewCount: number;
  avgScore: number;
  experienceLevel: string;
  onEditProfile?: () => void;
  className?: string;
}

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const contentVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.25 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const StatItem = ({
  icon: Icon,
  value,
  label,
}: {
  icon?: React.ElementType;
  value: string | number;
  label: string;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
    <div className="flex items-center gap-1 mb-0.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
      <span className="text-base font-bold text-slate-900">{value}</span>
    </div>
    <span className="text-[11px] capitalize text-slate-500 font-medium">{label}</span>
  </div>
);

const Divider = () => <div className="h-10 w-px bg-slate-200" />;

export const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  (
    {
      className,
      name,
      title,
      avatarSrc,
      bannerSrc,
      interviewCount,
      avgScore,
      experienceLevel,
      onEditProfile,
      ...props
    },
    ref
  ) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const defaultBanner =
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&fit=crop";

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100",
          className
        )}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        {...props}
      >
        <div className="h-32 w-full relative">
          <img
            src={bannerSrc || defaultBanner}
            alt="Profile banner"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>

        <button
          onClick={onEditProfile}
          className="absolute right-4 top-4 h-8 w-8 rounded-lg bg-white/70 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white/90 transition-colors shadow-sm"
          aria-label="Edit profile"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>

        <div className="absolute left-1/2 top-32 -translate-x-1/2 -translate-y-1/2">
          <Avatar className="h-20 w-20 border-4 border-white shadow-md">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <motion.div className="px-6 pb-6 pt-12" variants={contentVariants}>
          <motion.div className="mb-5 text-center" variants={itemVariants}>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{title || "Interview Candidate"}</p>
          </motion.div>

          <motion.div
            className="flex items-center justify-around rounded-xl border border-slate-100 bg-slate-50/70 p-4 mb-5"
            variants={itemVariants}
          >
            <StatItem
              icon={BarChart2}
              value={interviewCount}
              label="Interviews"
            />
            <Divider />
            <StatItem
              icon={Star}
              value={avgScore > 0 ? `${avgScore}%` : "—"}
              label="Avg Score"
            />
            <Divider />
            <StatItem
              icon={Layers}
              value={experienceLevel || "—"}
              label="Level"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <button
              onClick={onEditProfile}
              className="w-full py-2.5 bg-brand-electric text-white text-sm font-semibold rounded-xl hover:bg-brand-electric-dark transition-colors shadow-sm shadow-blue-500/20"
            >
              Edit Profile
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
);
ProfileCard.displayName = "ProfileCard";
