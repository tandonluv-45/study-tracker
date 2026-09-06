export interface MonthData {
  month: string;
  shortMonth: string;
  year: number;
  theme: string;
  phase: string;
  dsa: string;
  ai: string;
  coreCS: string;
  hrsPerWeek: string;
  monthEndGoal: string;
  goals: string[];
}

// DSA + AI Catch-Up Sprint — 2026-09-06 → 2027-02-28 (25 weeks).
// Restart after a mid-July stall. Prior progress (Basic Arrays/Hashing/Strings/
// Recursion, Sorting, some Arrays Medium/Hard, 100x AI Weeks 1-5) is assumed done.
// Each month's goals are the sprint checkpoints (a star each in the Orbit chart).
export const roadmap: MonthData[] = [
  {
    month: "September",
    shortMonth: "Sep",
    year: 2026,
    theme: "Catch-Up Ignition",
    phase: "P0",
    dsa: "Hashing FAQs, Binary Search, Recursion/Backtracking, Bit Manipulation, Greedy; start Sliding Window (~70 problems)",
    ai: "100x Weeks 6-8 — HuggingFace, first model, APIs to Agents",
    coreCS: "Sem 5 coursework",
    hrsPerWeek: "~17",
    monthEndGoal: "~70 problems cleared; AI through Week 8",
    goals: [
      "Hashing FAQs — longest subarray / xor problems",
      "Binary Search — fundamentals + logic building",
      "Binary Search — on answers + FAQs + 2D",
      "Recursion & Backtracking — subsets, N-Queen, Sudoku",
      "Bit Manipulation — single number + power set",
      "Greedy — intervals, scheduling, Candy",
      "Start Sliding Window / Two Pointer",
      "AI Week 6 — HuggingFace intro",
      "AI Week 7 — train your first model",
      "AI Week 8 — from APIs to agents",
    ],
  },
  {
    month: "October",
    shortMonth: "Oct",
    year: 2026,
    theme: "Linked Orbit",
    phase: "P0",
    dsa: "Finish Sliding Window; Linked List (all); start Stack/Queues",
    ai: "Weeks 9-10 — RAG app goes LIVE",
    coreCS: "Sem 5 mid-sems (Oct 12-19) — light week",
    hrsPerWeek: "~17 / 9 exam week",
    monthEndGoal: "Linked List done; RAG app deployed with README + demo GIF",
    goals: [
      "Finish Sliding Window / Two Pointer",
      "Linked List — singly fundamentals",
      "Linked List — doubly fundamentals",
      "Linked List — medium (loops, palindrome, intersection)",
      "Linked List — hard (reverse-K, flatten, clone)",
      "Start Stacks & Queues (implementations)",
      "AI Week 9 — RAG from the ground up (scaffold)",
      "AI Week 10 — RAG deployed + README + demo GIF",
      "Mid-sem exams (Oct 12-19) — protect CGPA",
    ],
  },
  {
    month: "November",
    shortMonth: "Nov",
    year: 2026,
    theme: "Timber Nebula",
    phase: "P0",
    dsa: "Finish Stack/Queues; Binary Trees; BST; Heaps (~75 problems)",
    ai: "Weeks 11-14 — Recursive LM + Fine-tuning (1-3)",
    coreCS: "Sem 5 coursework",
    hrsPerWeek: "~17",
    monthEndGoal: "Trees, BST & Heaps cleared; AI through Week 14",
    goals: [
      "Stacks & Queues — monotonic stack + LRU/LFU",
      "Binary Trees — traversals + medium",
      "Binary Trees — views, LCA, construction",
      "Binary Search Trees — full",
      "Heaps — implementation + top-K",
      "AI Week 11 — recursive language model",
      "AI Weeks 12-14 — fine-tuning (3 parts)",
    ],
  },
  {
    month: "December",
    shortMonth: "Dec",
    year: 2026,
    theme: "Exam Eclipse",
    phase: "P1",
    dsa: "Light during Dec 1-15 (revision); post-exam: Graphs traversal + cycles",
    ai: "Weeks 15-16 (light) — RLVR, RL environments",
    coreCS: "Sem 5 end-sems (Dec 1-15) — protect CGPA first",
    hrsPerWeek: "~9 exam / ~17 after",
    monthEndGoal: "Graphs traversal + cycles started post-exam",
    goals: [
      "End-sem exams (Dec 1-15) — revision only",
      "Graphs — traversals + connected components",
      "Graphs — islands, rotten oranges, flood fill",
      "Graphs — cycle detection + topo sort",
      "AI Week 15 — RLVR",
      "AI Week 16 — RL environments (offline)",
    ],
  },
  {
    month: "January",
    shortMonth: "Jan",
    year: 2027,
    theme: "Vector Voyage",
    phase: "P0",
    dsa: "Finish Graphs (hard + shortest path + MST); start DP (intro, 1D, 2D, grids, stocks)",
    ai: "Weeks 17-18; start the agent framework build",
    coreCS: "Sem 6 begins",
    hrsPerWeek: "~17",
    monthEndGoal: "Graphs complete; DP through stocks; agent framework started",
    goals: [
      "Graphs — hard (course schedule, alien dict, word ladder)",
      "Graphs — shortest path (Dijkstra, Bellman, Floyd)",
      "Graphs — MST + disjoint set + hard II",
      "DP — intro + 1D (climbing, house robber)",
      "DP — 2D + on grids",
      "DP — on stocks",
      "AI Week 17 — harness, context, evals",
      "AI Week 18 — memory",
      "Start agent framework — LangGraph",
    ],
  },
  {
    month: "February",
    shortMonth: "Feb",
    year: 2027,
    theme: "Summit Constellation",
    phase: "P0",
    dsa: "Finish DP (subsequences, LIS, strings, MCM); Tries; Advanced Strings; Maths — A2Z complete",
    ai: "Weeks 20-26 — agent framework SHIPPED by Feb 28",
    coreCS: "Sem 6 coursework",
    hrsPerWeek: "~17",
    monthEndGoal: "Full TUF A2Z complete; agent framework shipped with README + demo GIF",
    goals: [
      "DP — subsequences + knapsack",
      "DP — LIS family",
      "DP — on strings (LCS, edit distance)",
      "DP — MCM (partition, burst balloons)",
      "Tries — implementation + XOR problems",
      "Advanced Strings — KMP, Z-function, Rabin-Karp",
      "Maths — sieve + primes",
      "AI Weeks 20-22 — papers, LangGraph, code an agent",
      "AI Weeks 23-26 — HF e2e, observability, evals + SHIP",
    ],
  },
];

export function getCurrentMonthData(): MonthData {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const found = roadmap.find((m) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return m.month === monthNames[month] && m.year === year;
  });

  return found || roadmap[0];
}

export function getNextMonthData(): MonthData | null {
  const current = getCurrentMonthData();
  const idx = roadmap.indexOf(current);
  return idx < roadmap.length - 1 ? roadmap[idx + 1] : null;
}

export function getMonthByIndex(index: number): MonthData {
  return roadmap[Math.max(0, Math.min(index, roadmap.length - 1))];
}
