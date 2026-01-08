"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Spark } from "@/components/Spark";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@sbozh/react-ui/components/ui/tooltip";

const navItems = [
  { name: "Blog", href: "/blog" },
  { name: "CV", href: "/cv" },
  { name: "Projects", href: "/projects" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export function HomeHero() {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col items-center gap-12">
        <div className="text-center">
          <motion.h1
            className="tracking-tight sm:text-6xl transition-colors hover:text-primary"
            variants={item}
          >
            sbozh.me
          </motion.h1>
          <motion.p className="mt-4 text-muted-foreground" variants={item}>
            Personal startup
            <TooltipProvider delayDuration={1337}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Spark />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Easter egg is under construction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.p>
        </div>

        <motion.nav
          className="flex flex-col items-center gap-4"
          variants={item}
        >
          {navItems.map((navItem) => (
            <Link
              key={navItem.href}
              href={navItem.href}
              className="relative text-muted-foreground transition-colors hover:text-primary after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-[width] after:duration-200 after:ease-out hover:after:w-full"
            >
              {navItem.name}
            </Link>
          ))}
        </motion.nav>
      </div>
    </motion.div>
  );
}
