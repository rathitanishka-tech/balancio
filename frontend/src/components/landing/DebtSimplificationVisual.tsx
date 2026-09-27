"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMoney } from "@/lib/formatters/currency";
import { ArrowRight, Sparkles } from "lucide-react";

export function DebtSimplificationVisual() {
  const [phase, setPhase] = useState<"before" | "optimizing" | "after">("before");
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Auto loop
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (phase === "before") {
      timeout = setTimeout(() => setPhase("optimizing"), 4000);
    } else if (phase === "optimizing") {
      timeout = setTimeout(() => setPhase("after"), 2000);
    } else if (phase === "after") {
      timeout = setTimeout(() => setPhase("before"), 5000);
    }

    return () => clearTimeout(timeout);
  }, [phase]);

  // Nodes for A, B, C, D in a diamond/square layout
  const nodes = [
    { id: "A", x: 50, y: 50 },
    { id: "B", x: 250, y: 50 },
    { id: "C", x: 250, y: 250 },
    { id: "D", x: 50, y: 250 }
  ];

  // Original transactions (Before)
  const beforeLines = [
    { id: "AB", from: "A", to: "B", amount: 50000, path: "M 75 50 L 225 50" },
    { id: "AC", from: "A", to: "C", amount: 30000, path: "M 67.68 67.68 L 232.32 232.32" },
    { id: "CB", from: "C", to: "B", amount: 20000, path: "M 250 225 L 250 75" },
    { id: "DA", from: "D", to: "A", amount: 40000, path: "M 50 225 L 50 75" },
    { id: "DC", from: "D", to: "C", amount: 15000, path: "M 75 250 L 225 250" },
  ];

  // Simplified transactions (After)
  const afterLines = [
    { id: "AB_new", from: "A", to: "B", amount: 80000, path: "M 75 50 Q 150 20 225 50" },
    { id: "DA_new", from: "D", to: "A", amount: 55000, path: "M 50 225 Q 20 150 50 75" },
  ];

  const getNodePos = (id: string) => nodes.find(n => n.id === id)!;

  const isBefore = phase === "before";
  const isAfter = phase === "after";
  const isOptimizing = phase === "optimizing";

  return (
    <div className="flex w-full flex-col items-center justify-center">
      
      {/* Header Info */}
      <div className="mb-8 flex h-16 w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {isBefore && (
            <motion.div
              key="before"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center"
            >
              <span className="text-xs font-bold tracking-widest text-ink-muted">BEFORE</span>
              <span className="mt-1 text-sm font-semibold text-accent-rose">5 TRANSACTIONS</span>
            </motion.div>
          )}
          {isOptimizing && (
            <motion.div
              key="opt"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex items-center gap-2 text-accent-violet"
            >
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-bold tracking-widest">OPTIMIZING</span>
            </motion.div>
          )}
          {isAfter && (
            <motion.div
              key="after"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center"
            >
              <span className="text-xs font-bold tracking-widest text-ink-muted">AFTER</span>
              <span className="mt-1 text-lg font-bold text-accent-emerald">2 TRANSACTIONS</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SVG Network Canvas */}
      <div className="relative h-[300px] w-[300px]">
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 300 300">
          
          <defs>
            {/* Arrowhead for Before */}
            <marker id="arrow-before" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="currentColor" className="text-accent-rose opacity-60" />
            </marker>
            {/* Arrowhead for After */}
            <marker id="arrow-after" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="currentColor" className="text-accent-emerald" />
            </marker>
          </defs>

          {/* Before Lines */}
          <AnimatePresence>
            {(isBefore || isOptimizing) && beforeLines.map((line) => {
              const isActive = hoveredLine === line.id || hoveredLine === null;
              
              return (
                <motion.g
                  key={line.id}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: isOptimizing ? 0 : isActive ? 1 : 0.2, 
                    pathLength: isOptimizing ? 0 : 1 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: isOptimizing ? 1 : 0.5 }}
                  onMouseEnter={() => setHoveredLine(line.id)}
                  onMouseLeave={() => setHoveredLine(null)}
                  className="cursor-pointer"
                >
                  <motion.path
                    d={line.path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-accent-rose opacity-60"
                    markerEnd="url(#arrow-before)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                  {/* Invisible thicker path for easier hover */}
                  <path d={line.path} fill="none" stroke="transparent" strokeWidth="20" />
                  
                  {/* Amount Label Background */}
                  <rect 
                    x={getMidpoint(line.path).x - 24} 
                    y={getMidpoint(line.path).y - 12} 
                    width="48" height="24" rx="12" 
                    className="fill-bg-base stroke-line-subtle" 
                    strokeWidth="1"
                  />
                  {/* Amount Label Text */}
                  <text 
                    x={getMidpoint(line.path).x} 
                    y={getMidpoint(line.path).y + 4} 
                    textAnchor="middle" 
                    className="fill-ink-primary text-[10px] font-semibold"
                  >
                    {formatMoney(line.amount)}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* After Lines */}
          <AnimatePresence>
            {isAfter && afterLines.map((line) => {
              const isActive = hoveredLine === line.id || hoveredLine === null;

              return (
                <motion.g
                  key={line.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isActive ? 1 : 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  onMouseEnter={() => setHoveredLine(line.id)}
                  onMouseLeave={() => setHoveredLine(null)}
                  className="cursor-pointer"
                >
                  <motion.path
                    d={line.path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-accent-emerald drop-shadow-sm"
                    markerEnd="url(#arrow-after)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
                  />
                  <path d={line.path} fill="none" stroke="transparent" strokeWidth="20" />
                  
                  {/* Amount Label Background */}
                  <rect 
                    x={getMidpoint(line.path).x - 30} 
                    y={getMidpoint(line.path).y - 14} 
                    width="60" height="28" rx="14" 
                    className="fill-bg-elevated stroke-accent-emerald/30 drop-shadow-sm" 
                    strokeWidth="1.5"
                  />
                  {/* Amount Label Text */}
                  <text 
                    x={getMidpoint(line.path).x} 
                    y={getMidpoint(line.path).y + 4} 
                    textAnchor="middle" 
                    className="fill-accent-emerald text-[12px] font-bold"
                  >
                    {formatMoney(line.amount)}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = 
              hoveredLine && 
              ((isBefore && beforeLines.find(l => l.id === hoveredLine && (l.from === node.id || l.to === node.id))) ||
               (isAfter && afterLines.find(l => l.id === hoveredLine && (l.from === node.id || l.to === node.id))));
            
            const isDimmed = hoveredLine && !isHovered;

            // In "after" state, node C is completely isolated and dims away slightly
            const isIsolated = isAfter && node.id === "C";

            return (
              <motion.g
                key={node.id}
                animate={{
                  opacity: isIsolated ? 0.3 : isDimmed ? 0.4 : 1,
                  scale: isHovered ? 1.1 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Node Glass Background */}
                <circle cx={node.x} cy={node.y} r="22" className="fill-surface-2 stroke-line-strong drop-shadow-md" strokeWidth="1" />
                {/* Node Text */}
                <text x={node.x} y={node.y + 5} textAnchor="middle" className="fill-ink-primary text-sm font-semibold">
                  {node.id}
                </text>
                
                {/* Optional glow for active nodes in AFTER state */}
                {isAfter && !isIsolated && (
                  <circle cx={node.x} cy={node.y} r="26" className="fill-none stroke-accent-emerald/20" strokeWidth="2" />
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Very simple helper to find the midpoint of the SVG path strings we hardcoded
function getMidpoint(path: string) {
  if (path.includes("Q")) {
    // Quadratic bezier approx
    const parts = path.split(" ");
    if (path === "M 75 50 Q 150 20 225 50") return { x: 150, y: 35 };
    if (path === "M 50 225 Q 20 150 50 75") return { x: 35, y: 150 };
  }
  
  // Straight lines
  const parts = path.split(" ");
  const x1 = parseFloat(parts[1]);
  const y1 = parseFloat(parts[2]);
  const x2 = parseFloat(parts[4]);
  const y2 = parseFloat(parts[5]);
  
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2
  };
}
