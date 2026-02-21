import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "./button";

interface ActionProps {
  text: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface MailboxFullStateProps {
  imageUrl: string;
  title: string;
  description: string;
  primaryAction: ActionProps;
  secondaryAction: ActionProps;
}

export const MailboxFullState = ({
  imageUrl,
  title,
  description,
  primaryAction,
  secondaryAction,
}: MailboxFullStateProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <motion.div
      className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-labelledby="state-title"
    >
      <motion.img
        src={imageUrl}
        alt="Status illustration"
        className="mb-6 h-40 w-40 object-contain"
        variants={itemVariants}
      />

      <motion.h2
        id="state-title"
        className="text-2xl font-bold text-slate-900"
        variants={itemVariants}
      >
        {title}
      </motion.h2>

      <motion.p
        className="mt-2 text-sm text-slate-500 leading-relaxed"
        variants={itemVariants}
      >
        {description}
      </motion.p>

      <motion.div
        className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
        variants={itemVariants}
      >
        <Button
          variant="outline"
          className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.text}
        </Button>
        <Button
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
          onClick={primaryAction.onClick}
        >
          {primaryAction.icon && <span className="mr-2 h-4 w-4">{primaryAction.icon}</span>}
          {primaryAction.text}
        </Button>
      </motion.div>
    </motion.div>
  );
};
