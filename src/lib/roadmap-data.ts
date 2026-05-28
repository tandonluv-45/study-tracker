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

export const roadmap: MonthData[] = [
  {
    month: "June",
    shortMonth: "Jun",
    year: 2026,
    theme: "Vacation Sprint I",
    phase: "P0",
    dsa: "Arrays/Hashing, Two Pointers, Sliding Window, Binary Search, basic Recursion (~80-100 probs)",
    ai: "History (1-2) + Neural Nets (1); start HuggingFace (6). Scaffold the RAG app",
    coreCS: "3B1B LinAlg (optional, intuition)",
    hrsPerWeek: "~30",
    monthEndGoal: "~Half of A2Z patterns done; RAG app skeleton running locally",
    goals: [
      "Complete Arrays/Hashing problems on TUF A2Z",
      "Complete Two Pointers problems",
      "Complete Sliding Window problems",
      "Complete Binary Search problems",
      "Start basic Recursion problems",
      "Watch 100x History modules (1-2)",
      "Watch 100x Neural Networks module (1)",
      "Start HuggingFace e2e module (6)",
      "Scaffold RAG app (local skeleton running)",
      "3B1B Linear Algebra series (optional)",
    ],
  },
  {
    month: "July",
    shortMonth: "Jul",
    year: 2026,
    theme: "Vacation Sprint II",
    phase: "P0",
    dsa: "Stacks/Queues, Linked Lists, Trees/BST, Heaps, Graphs (BFS/DFS), intro DP (cumulative ~150-200)",
    ai: "Vector DBs & RAG (8), Context engineering (9). Build + DEPLOY RAG app",
    coreCS: "—",
    hrsPerWeek: "~30",
    monthEndGoal: "All core patterns covered once; RAG app live + README + demo GIF, pinned",
    goals: [
      "Complete Stacks/Queues problems",
      "Complete Linked Lists problems",
      "Complete Trees/BST problems",
      "Complete Heaps problems",
      "Complete Graphs BFS/DFS problems",
      "Start intro DP problems",
      "Complete 100x Vector DBs & RAG module (8)",
      "Complete 100x Context engineering module (9)",
      "Build and DEPLOY RAG app (live link)",
      "Write README + record 60-sec demo GIF",
      "Pin RAG app repo on GitHub",
    ],
  },
  {
    month: "August",
    shortMonth: "Aug",
    year: 2026,
    theme: "Sem 5 starts · Interviews",
    phase: "P1",
    dsa: "Switch to timed mediums; revise weak patterns",
    ai: "Polish RAG app for resume (no new modules)",
    coreCS: "OOP + DBMS (TUF). Finalize resume (XYZ), clean GitHub, 'Tell me about yourself,' start applying",
    hrsPerWeek: "~18-20",
    monthEndGoal: "Resume + GitHub ready; applications out; first interviews booked",
    goals: [
      "Switch DSA to timed medium problems",
      "Revise weak DSA patterns",
      "Polish RAG app for resume",
      "Complete OOP revision via TUF",
      "Complete DBMS revision via TUF",
      "Finalize resume in XYZ format",
      "Clean up GitHub profile",
      "Prepare 'Tell me about yourself' pitch",
      "Prepare 4-5 STAR stories",
      "Start applying to internships",
      "Book first interviews",
    ],
  },
  {
    month: "September",
    shortMonth: "Sep",
    year: 2026,
    theme: "Interview peak",
    phase: "P1",
    dsa: "Timed mediums + some hards; mock interviews",
    ai: "—",
    coreCS: "OS + CN (TUF). Interviews, follow-ups, keep funnel wide. (Mid-sem 1 — protect CGPA)",
    hrsPerWeek: "~15-18",
    monthEndGoal: "Internship interviews done; offer(s) in progress; core CS revised once",
    goals: [
      "Timed DSA mediums + some hards daily",
      "Do mock interviews",
      "Complete OS revision via TUF",
      "Complete CN revision via TUF",
      "Interview follow-ups",
      "Keep application funnel wide",
      "Mid-sem 1 exams — protect CGPA",
      "Secure internship offer(s)",
    ],
  },
  {
    month: "October",
    shortMonth: "Oct",
    year: 2026,
    theme: "Sem 5 Build",
    phase: "P2",
    dsa: "Maintenance 3-4/wk; deepen graphs",
    ai: "Observability/tracing (7), Agents from first principles (10). Start Project 1: Agent framework",
    coreCS: "Start Andrew Ng C1 (Wks 1-2: regression, gradient descent)",
    hrsPerWeek: "~18",
    monthEndGoal: "Andrew Ng C1 ~50%; agent framework scoped + begun",
    goals: [
      "DSA maintenance: 3-4 problems/week",
      "Deepen graph problems",
      "Complete 100x Observability/tracing module (7)",
      "Complete 100x Agents from first principles (10)",
      "Scope Project 1: Agent framework",
      "Start building Agent framework",
      "Andrew Ng C1 Weeks 1-2 (regression, gradient descent)",
    ],
  },
  {
    month: "November",
    shortMonth: "Nov",
    year: 2026,
    theme: "Sem 5 Build",
    phase: "P2",
    dsa: "Maintenance; deepen DP",
    ai: "Agent frameworks (11), Evals (17). Build agent framework",
    coreCS: "Finish Andrew Ng C1 (logistic regression, classification, regularization)",
    hrsPerWeek: "~18",
    monthEndGoal: "Andrew Ng C1 done; agent framework mostly built",
    goals: [
      "DSA maintenance + deepen DP",
      "Complete 100x Agent frameworks module (11)",
      "Complete 100x Evals module (17)",
      "Build agent framework (mostly complete)",
      "Finish Andrew Ng C1 (logistic regression, classification, regularization)",
    ],
  },
  {
    month: "December",
    shortMonth: "Dec",
    year: 2026,
    theme: "Sem 5 End-sem exams",
    phase: "P2",
    dsa: "Light maintenance only",
    ai: "Finish + deploy Agent framework + README/demo (early month)",
    coreCS: "End-sem exams — push CGPA → 8.0+",
    hrsPerWeek: "~10",
    monthEndGoal: "Agent framework shipped; semester aced",
    goals: [
      "Light DSA maintenance",
      "Finish Agent framework",
      "Deploy Agent framework",
      "Write README + demo for Agent framework",
      "End-sem exams — aim for CGPA 8.0+",
    ],
  },
  {
    month: "January",
    shortMonth: "Jan",
    year: 2027,
    theme: "Sem 6 · Minor-project kickoff",
    phase: "P3",
    dsa: "Resume timed practice, step up difficulty",
    ai: "Memory (12). Edge-AI minor project: start — Edge Impulse, pick build, wire board, collect data",
    coreCS: "—",
    hrsPerWeek: "~18",
    monthEndGoal: "Minor project scoped; data pipeline working on hardware",
    goals: [
      "Resume timed DSA practice (step up difficulty)",
      "Complete 100x Memory module (12)",
      "Scope Edge-AI minor project",
      "Set up Edge Impulse",
      "Pick build (ESP32-CAM / gesture / keyword spotting)",
      "Wire board + collect data",
      "Get data pipeline working on hardware",
    ],
  },
  {
    month: "February",
    shortMonth: "Feb",
    year: 2027,
    theme: "Sem 6 · Minor-project build",
    phase: "P3",
    dsa: "Timed mediums/hards",
    ai: "Computer use & multimodal (13). Edge AI: train → quantize (Int8) → flash to board",
    coreCS: "—",
    hrsPerWeek: "~18",
    monthEndGoal: "Minor project working prototype on device",
    goals: [
      "Timed DSA mediums/hards",
      "Complete 100x Computer use & multimodal module (13)",
      "Train Edge AI model",
      "Quantize model (Int8)",
      "Flash model to board",
      "Get working prototype on device",
    ],
  },
  {
    month: "March",
    shortMonth: "Mar",
    year: 2027,
    theme: "Sem 6 · Finetuning + polish",
    phase: "P3",
    dsa: "Continue",
    ai: "Finetuning (14-15). Finalize minor project: demo video + README + academic report",
    coreCS: "(Mid-sem 2 — exam dip)",
    hrsPerWeek: "~15",
    monthEndGoal: "Minor project complete + documented (academic + portfolio)",
    goals: [
      "Continue DSA practice",
      "Complete 100x Finetuning modules (14-15)",
      "Finalize minor project",
      "Record demo video for minor project",
      "Write README for minor project",
      "Write academic report for minor project",
      "Mid-sem 2 exams",
    ],
  },
  {
    month: "April",
    shortMonth: "Apr",
    year: 2027,
    theme: "Sem 6 · Internship lock",
    phase: "P3→4",
    dsa: "Maintenance/harder; begin LLD (TUF), light",
    ai: "Optional Project 4: Memory framework, or consolidate",
    coreCS: "Confirm + sign summer internship; make the fork decision (job / GATE / MS)",
    hrsPerWeek: "~16",
    monthEndGoal: "Internship locked; fork decided; LLD started",
    goals: [
      "DSA maintenance + harder problems",
      "Begin LLD via TUF (light)",
      "Optional: Start Project 4 (Memory framework)",
      "Confirm + sign summer internship",
      "Make fork decision (job / GATE / MS)",
    ],
  },
  {
    month: "May",
    shortMonth: "May",
    year: 2027,
    theme: "Sem 6 End-sem · Internship begins",
    phase: "P4",
    dsa: "Light (exams)",
    ai: "Transition to internship work",
    coreCS: "End-sem exams (final 3rd-yr CGPA push); internship starts late-May",
    hrsPerWeek: "~10 → intern",
    monthEndGoal: "3rd year closed strong; internship started",
    goals: [
      "Light DSA (exam period)",
      "Transition to internship work",
      "End-sem exams — final 3rd-yr CGPA push",
      "Start internship (late May)",
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
