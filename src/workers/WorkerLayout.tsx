// src/workers/WorkerLayout.tsx
import { WorkerHeader } from "@/components/Layout/WorkerHeader";
import WorkerSidebar from "@/workers/WorkerSidebar";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsDesktop } from "@/components/Layout/AppLayout";

export const WorkerLayout = () => {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => { setIsOpen(isDesktop); }, [isDesktop]);
  useEffect(() => { if (!isDesktop) setIsOpen(false); }, [location.pathname, isDesktop]);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <WorkerHeader onMenuClick={() => setIsOpen(!isOpen)} sidebarOpen={isOpen} />

      <div className="relative flex min-h-0 flex-1">
        {isDesktop ? (
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                className="shrink-0 overflow-hidden"
              >
                <WorkerSidebar isOpen />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  aria-hidden
                />
                <motion.div
                  className="fixed inset-y-0 left-0 z-50 shadow-elegant"
                  initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 420, damping: 40 }}
                >
                  <WorkerSidebar isOpen />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}
        {/* Outlet renders the content of the current nested route. */}
        <main className="admin-main custom-scrollbar min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
