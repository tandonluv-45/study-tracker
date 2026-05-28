"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Calendar, Flag } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { fetchTasks, createTask, updateTask, deleteTask, type Task } from "@/lib/api";

export default function DailyTasks() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<Task["category"]>("daily");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("medium");
  const [showFuture, setShowFuture] = useState(false);
  const [futureDate, setFutureDate] = useState("");
  const [futureTitle, setFutureTitle] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchTasks(selectedDate);
    setTasks(data);
  }, [selectedDate]);

  useEffect(() => { reload(); }, [reload]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask({ title: newTaskTitle.trim(), completed: false, date: selectedDate, category: newTaskCategory, priority: newTaskPriority });
    setNewTaskTitle("");
    reload();
  };

  const handleAddFutureTask = async () => {
    if (!futureTitle.trim() || !futureDate) return;
    await createTask({ title: futureTitle.trim(), completed: false, date: futureDate, category: "custom", priority: "medium" });
    setFutureTitle("");
    setFutureDate("");
    setShowFuture(false);
  };

  const handleToggle = async (id: string, completed: boolean) => {
    await updateTask(id, { completed: !completed });
    reload();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    reload();
  };

  const goToDate = (offset: number) => {
    const d = offset > 0 ? addDays(new Date(selectedDate), offset) : subDays(new Date(selectedDate), Math.abs(offset));
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

  const priorityColors: Record<string, string> = { high: "text-red", medium: "text-amber", low: "text-green" };
  const categoryBadges: Record<string, { label: string; color: string }> = {
    daily: { label: "Daily", color: "bg-accent-muted text-accent" },
    roadmap: { label: "Roadmap", color: "bg-green-muted text-green" },
    assignment: { label: "Assignment", color: "bg-amber-muted text-amber" },
    custom: { label: "Custom", color: "bg-blue-muted text-blue" },
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Tasks</h2>
        <button onClick={() => setShowFuture(!showFuture)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-muted text-accent hover:bg-accent/20 transition-colors">
          <Calendar size={14} /> Schedule Future Task
        </button>
      </div>

      {showFuture && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-5 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">Schedule a Future Task</h3>
          <div className="flex gap-3">
            <input type="date" value={futureDate} onChange={(e) => setFutureDate(e.target.value)}
              min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent" />
            <input type="text" value={futureTitle} onChange={(e) => setFutureTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFutureTask()} placeholder="Task description..."
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
            <button onClick={handleAddFutureTask}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">Add</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => goToDate(-1)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center min-w-[140px]">
            <p className="text-sm font-medium">{isToday ? "Today" : format(new Date(selectedDate), "EEEE")}</p>
            <p className="text-xs text-text-muted">{format(new Date(selectedDate), "MMMM d, yyyy")}</p>
          </div>
          <button onClick={() => goToDate(1)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text">
            <ChevronRight size={18} />
          </button>
        </div>
        {!isToday && (
          <button onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            className="text-xs text-accent hover:text-accent-hover font-medium">Go to Today</button>
        )}
        <div className="text-sm text-text-muted">{completedCount}/{tasks.length} done</div>
      </div>

      {tasks.length > 0 && (
        <div className="w-full bg-border rounded-full h-1.5 mb-5">
          <div className="h-1.5 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }} />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()} placeholder="Add a new task..."
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors" />
        <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value as Task["category"])}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-muted focus:outline-none focus:border-accent">
          <option value="daily">Daily</option><option value="roadmap">Roadmap</option>
          <option value="assignment">Assignment</option><option value="custom">Custom</option>
        </select>
        <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Task["priority"])}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-muted focus:outline-none focus:border-accent">
          <option value="low">Low</option><option value="medium">Med</option><option value="high">High</option>
        </select>
        <button onClick={handleAddTask} className="p-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-text-dim">
            <p className="text-sm">No tasks for this day yet.</p>
            <p className="text-xs mt-1">Add one above to get started!</p>
          </div>
        ) : (
          tasks
            .sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              const pr = { high: 0, medium: 1, low: 2 };
              return (pr[a.priority || "medium"] || 1) - (pr[b.priority || "medium"] || 1);
            })
            .map((task) => (
              <div key={task.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  task.completed ? "bg-green-muted border-border opacity-60" : "bg-surface border-border hover:border-border-light"}`}>
                <button onClick={() => handleToggle(task.id, task.completed)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    task.completed ? "bg-green border-green" : "border-border-light hover:border-accent"}`}>
                  {task.completed && <Check size={12} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? "line-through text-text-muted" : ""}`}>{task.title}</p>
                </div>
                {task.priority && <Flag size={12} className={priorityColors[task.priority] || "text-text-muted"} />}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${categoryBadges[task.category]?.color || ""}`}>
                  {categoryBadges[task.category]?.label || task.category}
                </span>
                <button onClick={() => handleDelete(task.id)}
                  className="p-1 rounded hover:bg-red-muted text-text-dim hover:text-red transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
