// DSA + AI catch-up sprint — the full per-problem plan (source: catchup_planner_data.md).
// Prior progress (Basic Arrays/Hashing/Strings/Recursion, Sorting, some Arrays
// Medium/Hard, 100x AI Weeks 1-5) is assumed done and NOT listed here.

export type SprintStatus = "none" | "attempted" | "solved" | "looked_up" | "struggled";

export interface SprintItem {
  id: string;
  track: "dsa" | "ai";
  topic: string;
  sub: string;
  title: string;
  units: number; // ~0.5h each — used to pack the schedule
  deliverable?: string;
}

interface Topic { topic: string; items: { sub: string; title: string }[] }

const DSA_TOPICS: Topic[] = [
  { topic: "Hashing", items: [
    { sub: "FAQs", title: "Longest Consecutive Sequence in an Array" },
    { sub: "FAQs", title: "Longest subarray with sum K" },
    { sub: "FAQs", title: "Count subarrays with given sum" },
    { sub: "FAQs", title: "Count subarrays with given xor K" },
  ]},
  { topic: "Binary Search", items: [
    { sub: "Fundamentals", title: "Search X in sorted array" },
    { sub: "Fundamentals", title: "Lower Bound" },
    { sub: "Fundamentals", title: "Upper Bound" },
    { sub: "Logic Building", title: "Search insert position" },
    { sub: "Logic Building", title: "Floor and Ceil in Sorted Array" },
    { sub: "Logic Building", title: "First and last occurrence" },
    { sub: "Logic Building", title: "Search in rotated sorted array-I" },
    { sub: "Logic Building", title: "Search in rotated sorted array-II" },
    { sub: "Logic Building", title: "Find minimum in Rotated Sorted Array" },
    { sub: "Logic Building", title: "Find out how many times the array is rotated" },
    { sub: "Logic Building", title: "Single element in sorted array" },
    { sub: "On Answers", title: "Find square root of a number" },
    { sub: "On Answers", title: "Find Nth root of a number" },
    { sub: "On Answers", title: "Find the smallest divisor" },
    { sub: "On Answers", title: "Koko eating bananas" },
    { sub: "On Answers", title: "Minimum days to make M bouquets" },
    { sub: "FAQs", title: "Aggressive Cows" },
    { sub: "FAQs", title: "Book Allocation Problem" },
    { sub: "FAQs", title: "Find peak element" },
    { sub: "FAQs", title: "Median of 2 sorted arrays" },
    { sub: "FAQs", title: "Kth element of 2 sorted arrays" },
    { sub: "FAQs", title: "Minimize Max Distance to Gas Station" },
    { sub: "FAQs", title: "Split array - largest sum" },
    { sub: "2D Arrays", title: "Find row with maximum 1's" },
    { sub: "2D Arrays", title: "Search in a 2D matrix" },
    { sub: "2D Arrays", title: "Search in 2D matrix - II" },
    { sub: "2D Arrays", title: "Find Peak Element - II" },
    { sub: "2D Arrays", title: "Matrix Median" },
  ]},
  { topic: "Recursion / Backtracking", items: [
    { sub: "Implementation", title: "Pow(x,n)" },
    { sub: "Implementation", title: "Generate Parentheses" },
    { sub: "Implementation", title: "Power Set" },
    { sub: "Subsequence Pattern", title: "Check if there exists a subsequence with sum K" },
    { sub: "Subsequence Pattern", title: "Count all subsequences with sum K" },
    { sub: "FAQs (Medium)", title: "Combination Sum" },
    { sub: "FAQs (Medium)", title: "Combination Sum II" },
    { sub: "FAQs (Medium)", title: "Subsets I" },
    { sub: "FAQs (Medium)", title: "Subsets II" },
    { sub: "FAQs (Medium)", title: "Combination Sum III" },
    { sub: "Hard", title: "Letter Combinations of a Phone Number" },
    { sub: "FAQs (Hard)", title: "Palindrome partitioning" },
    { sub: "FAQs (Hard)", title: "Word Search" },
    { sub: "FAQs (Hard)", title: "N Queen" },
    { sub: "FAQs (Hard)", title: "Rat in a Maze" },
    { sub: "FAQs (Hard)", title: "M Coloring Problem" },
    { sub: "FAQs (Hard)", title: "Sudoku Solver" },
  ]},
  { topic: "Linked List", items: [
    { sub: "Single LL", title: "Introduction to Singly LinkedList" },
    { sub: "Single LL", title: "Traversal in Linked List" },
    { sub: "Single LL", title: "Deletion in Linked List" },
    { sub: "Single LL", title: "Insertion in Linked List" },
    { sub: "Single LL", title: "Deletion of the head of LL" },
    { sub: "Single LL", title: "Deletion of the tail of Linked List" },
    { sub: "Single LL", title: "Deletion of the Kth element of Linked List" },
    { sub: "Single LL", title: "Delete the element with value X" },
    { sub: "Single LL", title: "Insertion at the head of Linked List" },
    { sub: "Single LL", title: "Insertion at the tail of Linked List" },
    { sub: "Single LL", title: "Insertion at the Kth position of Linked List" },
    { sub: "Single LL", title: "Insertion before the value X in Linked List" },
    { sub: "Doubly LL", title: "Introduction to Doubly LL" },
    { sub: "Doubly LL", title: "Deletion in Doubly LL" },
    { sub: "Doubly LL", title: "Insertion in DLL" },
    { sub: "Doubly LL", title: "Convert Array to Doubly Linked List" },
    { sub: "Doubly LL", title: "Delete head of Doubly Linked List" },
    { sub: "Doubly LL", title: "Delete Tail of Doubly Linked List" },
    { sub: "Doubly LL", title: "Delete Kth Element of Doubly Linked List" },
    { sub: "Doubly LL", title: "Removing given node in Doubly Linked List" },
    { sub: "Doubly LL", title: "Insert node before head in Doubly Linked List" },
    { sub: "Doubly LL", title: "Insert node before tail in Doubly Linked List" },
    { sub: "Doubly LL", title: "Insert node before (kth node) in Doubly Linked List" },
    { sub: "Doubly LL", title: "Insert before given node in Doubly Linked List" },
    { sub: "Logic Building", title: "Add two numbers in Linked List" },
    { sub: "Logic Building", title: "Segregate odd and even nodes in Linked List" },
    { sub: "Logic Building", title: "Sort a Linked List of 0's 1's and 2's" },
    { sub: "Logic Building", title: "Remove Nth node from the back of the LL" },
    { sub: "Logic Building", title: "Reverse a LL" },
    { sub: "Medium", title: "Add one to a number represented by LL" },
    { sub: "Medium", title: "Find Middle of Linked List" },
    { sub: "Medium", title: "Delete the middle node in LL" },
    { sub: "Medium", title: "Check if LL is palindrome or not" },
    { sub: "Medium", title: "Find the intersection point of Y LL" },
    { sub: "Medium", title: "Detect a loop in LL" },
    { sub: "Medium", title: "Find the starting point in LL" },
    { sub: "Medium", title: "Length of loop in LL" },
    { sub: "Hard", title: "Reverse LL in group of given size K" },
    { sub: "Hard", title: "Rotate a LL" },
    { sub: "Hard", title: "Merge two Sorted Lists" },
    { sub: "Hard", title: "Flattening of LL" },
    { sub: "Hard", title: "Sort LL" },
    { sub: "Hard", title: "Clone a LL with random and next pointer" },
    { sub: "DLL", title: "Delete all occurrences of a key in DLL" },
    { sub: "DLL", title: "Remove duplicates from sorted DLL" },
  ]},
  { topic: "Bit Manipulation", items: [
    { sub: "Problems", title: "Minimum Bit Flips to Convert Number" },
    { sub: "Problems", title: "Single Number - I" },
    { sub: "Problems", title: "Single Number - II" },
    { sub: "Problems", title: "Single Number - III" },
    { sub: "Problems", title: "Divide two numbers without multiplication and division" },
    { sub: "Problems", title: "Power Set Bit Manipulation" },
    { sub: "Problems", title: "XOR of numbers in a given range" },
  ]},
  { topic: "Greedy", items: [
    { sub: "Easy", title: "Assign Cookies" },
    { sub: "Easy", title: "Lemonade Change" },
    { sub: "Easy", title: "Jump Game - I" },
    { sub: "Scheduling", title: "Shortest Job First" },
    { sub: "Scheduling", title: "Job sequencing Problem" },
    { sub: "Scheduling", title: "N meetings in one room" },
    { sub: "Scheduling", title: "Non-overlapping Intervals" },
    { sub: "Scheduling", title: "Insert Interval" },
    { sub: "Scheduling", title: "Minimum number of platforms required for a railway" },
    { sub: "Hard", title: "Valid Paranthesis Checker" },
    { sub: "Hard", title: "Candy" },
  ]},
  { topic: "Sliding Window / Two Pointer", items: [
    { sub: "Constant Window", title: "Maximum Points You Can Obtain from Cards" },
    { sub: "Longest/Smallest", title: "Longest Substring Without Repeating Characters" },
    { sub: "Longest/Smallest", title: "Max Consecutive Ones III" },
    { sub: "Longest/Smallest", title: "Fruit Into Baskets" },
    { sub: "Longest/Smallest", title: "Longest Substring With At Most K Distinct Characters" },
    { sub: "Longest/Smallest", title: "Longest Repeating Character Replacement" },
    { sub: "Longest/Smallest", title: "Minimum Window Substring" },
    { sub: "Counting Subarrays", title: "Number of Substrings Containing All Three Characters" },
    { sub: "Counting Subarrays", title: "Binary Subarrays With Sum" },
    { sub: "Counting Subarrays", title: "Count number of Nice subarrays" },
  ]},
  { topic: "Stack / Queues", items: [
    { sub: "Implementation", title: "Implementation using different DS" },
    { sub: "Implementation", title: "Implement Stack using Arrays" },
    { sub: "Implementation", title: "Implement Queue using Arrays" },
    { sub: "Implementation", title: "Implement Stack using Queue" },
    { sub: "Implementation", title: "Implement Queue using Stack" },
    { sub: "Implementation", title: "Implement stack using Linkedlist" },
    { sub: "Implementation", title: "Implement queue using Linkedlist" },
    { sub: "Implementation", title: "Balanced Paranthesis" },
    { sub: "Monotonic Stack", title: "Next Greater Element" },
    { sub: "Monotonic Stack", title: "Next Greater Element - 2" },
    { sub: "Monotonic Stack", title: "Asteroid Collision" },
    { sub: "Monotonic Stack", title: "Sum of Subarray Minimums" },
    { sub: "Monotonic Stack", title: "Sum of Subarray Ranges" },
    { sub: "Monotonic Stack", title: "Remove K Digits" },
    { sub: "FAQs", title: "Implement Min Stack" },
    { sub: "FAQs", title: "Sliding Window Maximum" },
    { sub: "FAQs", title: "Trapping Rainwater" },
    { sub: "FAQs", title: "Largest rectangle in a histogram" },
    { sub: "FAQs", title: "Maximum Rectangles" },
    { sub: "FAQs", title: "Stock span problem" },
    { sub: "FAQs", title: "Celebrity Problem" },
    { sub: "FAQs", title: "LRU Cache" },
    { sub: "FAQs", title: "LFU Cache" },
  ]},
  { topic: "Binary Trees", items: [
    { sub: "Traversals", title: "Introduction" },
    { sub: "Traversals", title: "Inorder Traversal" },
    { sub: "Traversals", title: "Preorder Traversal" },
    { sub: "Traversals", title: "Postorder Traversal" },
    { sub: "Traversals", title: "Level Order Traversal" },
    { sub: "Traversals", title: "Pre, Post, Inorder in one traversal" },
    { sub: "Medium", title: "Maximum Depth in BT" },
    { sub: "Medium", title: "Check if two trees are identical or not" },
    { sub: "Medium", title: "Check for balanced binary tree" },
    { sub: "Medium", title: "Diameter of Binary Tree" },
    { sub: "Medium", title: "Maximum path sum" },
    { sub: "Medium", title: "Check for symmetrical BTs" },
    { sub: "FAQs", title: "Zig Zag or Spiral Traversal" },
    { sub: "FAQs", title: "Boundary Traversal" },
    { sub: "FAQs", title: "Vertical Order Traversal" },
    { sub: "FAQs", title: "Top View of BT" },
    { sub: "FAQs", title: "Bottom view of BT" },
    { sub: "FAQs", title: "Right/Left View of BT" },
    { sub: "FAQs", title: "Print root to leaf path in BT" },
    { sub: "FAQs", title: "LCA in BT" },
    { sub: "FAQs", title: "Maximum Width of BT" },
    { sub: "FAQs", title: "Print all nodes at a distance of K in BT" },
    { sub: "FAQs", title: "Minimum time taken to burn the BT from a given Node" },
    { sub: "FAQs", title: "Count total nodes in a complete BT" },
    { sub: "Construction", title: "Requirements needed to construct a unique BT" },
    { sub: "Construction", title: "Construct a BT from Preorder and Inorder" },
    { sub: "Construction", title: "Construct a BT from Postorder and Inorder" },
    { sub: "Construction", title: "Serialize and De-serialize BT" },
    { sub: "Constant Space", title: "Morris Inorder Traversal" },
    { sub: "Constant Space", title: "Morris Preorder Traversal" },
  ]},
  { topic: "Binary Search Trees", items: [
    { sub: "Basics", title: "Introduction to BST" },
    { sub: "Basics", title: "Search in BST" },
    { sub: "Basics", title: "Floor and Ceil in a BST" },
    { sub: "Medium", title: "Insert a given node in BST" },
    { sub: "Medium", title: "Delete a node in BST" },
    { sub: "Medium", title: "Kth Smallest and Largest element in BST" },
    { sub: "Medium", title: "Check if a tree is a BST or not" },
    { sub: "Medium", title: "LCA in BST" },
    { sub: "Medium", title: "Construct a BST from a preorder traversal" },
    { sub: "Medium", title: "Inorder successor and predecessor in BST" },
    { sub: "FAQs", title: "BST iterator" },
    { sub: "FAQs", title: "Two sum in BST" },
    { sub: "FAQs", title: "Correct BST with two nodes swapped" },
    { sub: "FAQs", title: "Largest BST in Binary Tree" },
  ]},
  { topic: "Heaps", items: [
    { sub: "Theory", title: "Heaps (Theory Video)" },
    { sub: "Theory", title: "Heapify Algorithm" },
    { sub: "Theory", title: "Build heap from a given Array" },
    { sub: "Theory", title: "Implement Min Heap" },
    { sub: "Theory", title: "Implement Max Heap" },
    { sub: "Theory", title: "Check if an array represents a min heap" },
    { sub: "Theory", title: "Convert Min Heap to Max Heap" },
    { sub: "Theory", title: "Heap Sort" },
    { sub: "Theory", title: "K-th Largest element in an array" },
    { sub: "FAQs", title: "Kth largest element in a stream of running integers" },
  ]},
  { topic: "Graphs", items: [
    { sub: "Traversals", title: "Introduction to Graph" },
    { sub: "Traversals", title: "Traversal Techniques" },
    { sub: "Traversals", title: "Connected Components" },
    { sub: "Traversal Problems", title: "Number of provinces" },
    { sub: "Traversal Problems", title: "Number of islands" },
    { sub: "Traversal Problems", title: "Flood fill algorithm" },
    { sub: "Traversal Problems", title: "Number of enclaves" },
    { sub: "Traversal Problems", title: "Rotten Oranges" },
    { sub: "Traversal Problems", title: "Distance of nearest cell having one" },
    { sub: "Traversal Problems", title: "Surrounded Regions" },
    { sub: "Traversal Problems", title: "Number of distinct islands" },
    { sub: "Cycles", title: "Detect a cycle in an undirected graph" },
    { sub: "Cycles", title: "Bipartite graph" },
    { sub: "Cycles", title: "Topological sort or Kahn's algorithm" },
    { sub: "Cycles", title: "Detect a cycle in a directed graph" },
    { sub: "Hard", title: "Find eventual safe states" },
    { sub: "Hard", title: "Course Schedule I" },
    { sub: "Hard", title: "Course Schedule II" },
    { sub: "Hard", title: "Alien Dictionary" },
    { sub: "Hard", title: "Shortest path in DAG" },
    { sub: "Hard", title: "Shortest path in undirected graph with unit weights" },
    { sub: "Hard", title: "Word ladder I" },
    { sub: "Hard", title: "Word ladder II" },
    { sub: "Shortest Path", title: "Dijkstra's algorithm" },
    { sub: "Shortest Path", title: "Print Shortest Path" },
    { sub: "Shortest Path", title: "Shortest Distance in a Binary Maze" },
    { sub: "Shortest Path", title: "Path with minimum effort" },
    { sub: "Shortest Path", title: "Cheapest flight within K stops" },
    { sub: "Shortest Path", title: "Minimum multiplications to reach end" },
    { sub: "Shortest Path", title: "Number of ways to arrive at destination" },
    { sub: "Shortest Path", title: "Bellman ford algorithm" },
    { sub: "Shortest Path", title: "Floyd warshall algorithm" },
    { sub: "Shortest Path", title: "Find the city with the smallest number of neighbors" },
    { sub: "MST", title: "MST theory" },
    { sub: "MST", title: "Disjoint Set" },
    { sub: "MST", title: "Find the MST weight" },
    { sub: "Hard II", title: "Number of operations to make network connected" },
    { sub: "Hard II", title: "Accounts merge" },
    { sub: "Hard II", title: "Number of islands II" },
    { sub: "Hard II", title: "Making a large island" },
    { sub: "Hard II", title: "Most stones removed with same row or column" },
    { sub: "Additional", title: "Kosaraju's algorithm" },
    { sub: "Additional", title: "Bridges in graph" },
    { sub: "Additional", title: "Articulation point in graph" },
  ]},
  { topic: "Dynamic Programming", items: [
    { sub: "Intro", title: "Introduction to DP" },
    { sub: "1D DP", title: "Climbing stairs" },
    { sub: "1D DP", title: "Frog Jump" },
    { sub: "1D DP", title: "Frog jump with K distances" },
    { sub: "1D DP", title: "Maximum sum of non adjacent elements" },
    { sub: "1D DP", title: "House robber" },
    { sub: "2D DP", title: "Ninja's training" },
    { sub: "Grids", title: "Grid unique paths" },
    { sub: "Grids", title: "Unique paths II" },
    { sub: "Grids", title: "Minimum Falling Path Sum" },
    { sub: "Grids", title: "Triangle" },
    { sub: "Grids", title: "Cherry pickup II" },
    { sub: "Stocks", title: "Best time to buy and sell stock" },
    { sub: "Stocks", title: "Best time to buy and sell stock II" },
    { sub: "Stocks", title: "Best time to buy and sell stock III" },
    { sub: "Stocks", title: "Best time to buy and sell stock IV" },
    { sub: "Stocks", title: "Best time to buy and sell stock with transaction fees" },
    { sub: "Subsequences", title: "Subset sum equals to target" },
    { sub: "Subsequences", title: "Partition equal subset sum" },
    { sub: "Subsequences", title: "Partition set into two subsets with min abs diff" },
    { sub: "Subsequences", title: "Count subsets with sum K" },
    { sub: "Subsequences", title: "Count partitions with given difference" },
    { sub: "Subsequences", title: "0 and 1 Knapsack" },
    { sub: "Subsequences", title: "Minimum coins" },
    { sub: "Subsequences", title: "Target sum" },
    { sub: "Subsequences", title: "Coin change II" },
    { sub: "Subsequences", title: "Unbounded knapsack" },
    { sub: "Subsequences", title: "Rod cutting problem" },
    { sub: "LIS", title: "Longest Increasing Subsequence" },
    { sub: "LIS", title: "Print Longest Increasing Subsequence" },
    { sub: "LIS", title: "Largest Divisible Subset" },
    { sub: "LIS", title: "Longest String Chain" },
    { sub: "LIS", title: "Longest Bitonic Subsequence" },
    { sub: "LIS", title: "Number of Longest Increasing Subsequences" },
    { sub: "Strings", title: "Longest common subsequence" },
    { sub: "Strings", title: "Longest common substring" },
    { sub: "Strings", title: "Longest palindromic subsequence" },
    { sub: "Strings", title: "Minimum insertions to make string palindrome" },
    { sub: "Strings", title: "Min insertions/deletions to convert A to B" },
    { sub: "Strings", title: "Shortest common supersequence" },
    { sub: "Strings", title: "Distinct subsequences" },
    { sub: "Strings", title: "Edit distance" },
    { sub: "Strings", title: "Wildcard matching" },
    { sub: "MCM", title: "Matrix chain multiplication" },
    { sub: "MCM", title: "Minimum cost to cut the stick" },
    { sub: "MCM", title: "Burst balloons" },
    { sub: "MCM", title: "Palindrome partitioning II" },
  ]},
  { topic: "Tries", items: [
    { sub: "Theory", title: "Trie Implementation and Operations" },
    { sub: "Theory", title: "Trie Implementation and Advanced Operations" },
    { sub: "Problems", title: "Longest Word with All Prefixes" },
    { sub: "Problems", title: "Number of distinct substrings in a string" },
    { sub: "Problems", title: "Maximum XOR of two numbers in an array" },
    { sub: "Problems", title: "Maximum Xor with an element from an array" },
  ]},
  { topic: "Strings (Advanced)", items: [
    { sub: "Medium", title: "Reverse every word in a string" },
    { sub: "Medium", title: "Min bracket reversals to balance expression" },
    { sub: "Medium", title: "Count and say" },
    { sub: "Advanced", title: "Rabin Karp Algorithm" },
    { sub: "Advanced", title: "Z function" },
    { sub: "Advanced", title: "KMP Algorithm or LPS array" },
    { sub: "Advanced", title: "Shortest Palindrome" },
    { sub: "Advanced", title: "Longest happy prefix" },
  ]},
  { topic: "Maths", items: [
    { sub: "Sieve", title: "Print all primes till N" },
    { sub: "Sieve", title: "Prime factorisation of a Number" },
    { sub: "Sieve", title: "Count primes in range L to R" },
  ]},
];

const AI_WEEKS = [
  { week: 6, title: "HuggingFace (intro)", hours: 2.0, deliverable: "notes" },
  { week: 7, title: "Training Your First Model", hours: 1.6, deliverable: "notes + trained model" },
  { week: 8, title: "From APIs to Agents", hours: 2.0, deliverable: "notes" },
  { week: 9, title: "RAG from the Ground Up — Part 1", hours: 1.7, deliverable: "RAG app scaffold" },
  { week: 10, title: "RAG Continuation — Part 2", hours: 1.5, deliverable: "RAG deployed + README + demo GIF" },
  { week: 11, title: "Recursive Language Model", hours: 1.6, deliverable: "notes" },
  { week: 12, title: "Fine-tuning", hours: 1.8, deliverable: "notes" },
  { week: 13, title: "Fine-tuning — Part 2", hours: 1.7, deliverable: "notes" },
  { week: 14, title: "Fine-tuning — Part 3", hours: 1.6, deliverable: "notes" },
  { week: 15, title: "RLVR", hours: 1.6, deliverable: "notes" },
  { week: 16, title: "Offline: RL Environments for LLMs", hours: 1.2, deliverable: "notes" },
  { week: 17, title: "Harness, Context, and Evals", hours: 2.1, deliverable: "notes" },
  { week: 18, title: "Memory", hours: 2.1, deliverable: "notes" },
  { week: 20, title: "How To Read Research Papers", hours: 0.9, deliverable: "notes" },
  { week: 21, title: "LangGraph", hours: 1.4, deliverable: "agent: graph structure" },
  { week: 22, title: "Coding an Agent (Assignment)", hours: 1.4, deliverable: "agent: working agent" },
  { week: 23, title: "Hugging Face End-to-End", hours: 1.5, deliverable: "notes" },
  { week: 24, title: "LLM Observability", hours: 1.75, deliverable: "agent: tracing" },
  { week: 25, title: "Computer Use Agents", hours: 1.2, deliverable: "notes" },
  { week: 26, title: "Evals", hours: 1.6, deliverable: "agent: eval suite + shipped" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

function buildOrdered(): SprintItem[] {
  const dsa: SprintItem[] = DSA_TOPICS.flatMap((t) =>
    t.items.map((it) => ({ id: `d:${slug(t.topic)}:${slug(it.title)}`, track: "dsa" as const, topic: t.topic, sub: it.sub, title: it.title, units: 1 }))
  );
  const ai: SprintItem[] = AI_WEEKS.map((w) => ({
    id: `a:${w.week}`, track: "ai" as const, topic: "100x AI", sub: `Week ${w.week}`, title: w.title,
    units: Math.max(2, Math.round(w.hours * 2)), deliverable: w.deliverable,
  }));
  // Interleave AI weeks through the DSA stream so both tracks progress in parallel.
  const ratio = Math.max(1, Math.floor(dsa.length / (ai.length + 1)));
  const out: SprintItem[] = [];
  let ai_i = 0;
  for (let i = 0; i < dsa.length; i++) {
    out.push(dsa[i]);
    if ((i + 1) % ratio === 0 && ai_i < ai.length) out.push(ai[ai_i++]);
  }
  while (ai_i < ai.length) out.push(ai[ai_i++]);
  return out;
}

export const SPRINT_ITEMS: SprintItem[] = buildOrdered();
export const TOPICS: string[] = [...DSA_TOPICS.map((t) => t.topic), "100x AI"];

// ---------- schedule ----------
export const DEFAULT_START = "2026-09-14"; // Monday
const EXAM_WINDOWS: [string, string][] = [["2026-10-12", "2026-10-19"], ["2026-12-01", "2026-12-15"]];

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };

function inExam(dateISO: string): boolean {
  return EXAM_WINDOWS.some(([a, b]) => dateISO >= a && dateISO <= b);
}
function capacity(dateISO: string, off: Set<string>): number {
  if (off.has(dateISO)) return 0;
  if (inExam(dateISO)) return 3;
  const wd = parseISO(dateISO).getDay();
  return wd === 0 || wd === 6 ? 4 : 6;
}

export interface SprintState {
  startDate: string;
  daysOff: string[];
  overrides: Record<string, string>; // itemId -> pinned ISO date
  statuses: Record<string, SprintStatus>;
}

export interface Scheduled { byId: Map<string, string>; byDate: Map<string, SprintItem[]> }

export function schedule(state: SprintState): Scheduled {
  const off = new Set(state.daysOff || []);
  const overrides = state.overrides || {};
  const overriddenIds = new Set(Object.keys(overrides));
  const pinnedByDate = new Map<string, SprintItem[]>();
  const byId = new Map<string, string>();
  const itemsById = new Map(SPRINT_ITEMS.map((it) => [it.id, it]));
  let maxPinned = state.startDate;
  for (const [id, date] of Object.entries(overrides)) {
    const it = itemsById.get(id); if (!it) continue;
    if (!pinnedByDate.has(date)) pinnedByDate.set(date, []);
    pinnedByDate.get(date)!.push(it);
    byId.set(id, date);
    if (date > maxPinned) maxPinned = date;
  }
  const queue = SPRINT_ITEMS.filter((it) => !overriddenIds.has(it.id));
  const byDate = new Map<string, SprintItem[]>();
  let qi = 0;
  let day = state.startDate;
  let guard = 0;
  while ((qi < queue.length || day <= maxPinned) && guard < 3000) {
    let cap = capacity(day, off);
    const dayItems: SprintItem[] = [];
    const pinned = pinnedByDate.get(day);
    if (pinned) { for (const it of pinned) { dayItems.push(it); cap -= it.units; } }
    while (qi < queue.length && cap > 0) { const it = queue[qi]; dayItems.push(it); byId.set(it.id, day); cap -= it.units; qi++; }
    if (dayItems.length) byDate.set(day, dayItems);
    day = addDays(day, 1);
    guard++;
  }
  return { byId, byDate };
}
