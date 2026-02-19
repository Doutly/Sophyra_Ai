import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function TubelightNavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      const matched = items.find(
        (item) => item.url.replace("#", "") === hash
      )
      if (matched) setActiveTab(matched.name)
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [items])

  return (
    <div className={cn("flex items-center gap-1 bg-white/5 border border-white/10 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg", className)}>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.name

        return (
          <a
            key={item.name}
            href={item.url}
            onClick={() => setActiveTab(item.name)}
            className={cn(
              "relative cursor-pointer text-xs font-semibold px-4 py-2 rounded-full transition-colors",
              "text-white/50 hover:text-white",
              isActive && "text-white"
            )}
          >
            <span className="hidden md:inline">{item.name}</span>
            <span className="md:hidden">
              <Icon size={16} strokeWidth={2.5} />
            </span>
            {isActive && (
              <motion.div
                layoutId="lamp"
                className="absolute inset-0 w-full bg-white/8 rounded-full -z-10"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-blue-400 rounded-t-full">
                  <div className="absolute w-10 h-5 bg-blue-400/20 rounded-full blur-md -top-2 -left-2" />
                  <div className="absolute w-6 h-5 bg-blue-400/20 rounded-full blur-md -top-1" />
                  <div className="absolute w-3 h-3 bg-blue-400/20 rounded-full blur-sm top-0 left-1.5" />
                </div>
              </motion.div>
            )}
          </a>
        )
      })}
    </div>
  )
}
