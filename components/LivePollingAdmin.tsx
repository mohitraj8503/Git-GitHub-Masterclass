import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LivePollingAdminProps {
  adminEmail: string;
  showToast: (type: "success" | "error", message: string) => void;
}

export default function LivePollingAdmin({ adminEmail, showToast }: LivePollingAdminProps) {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Poll Form State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [type, setType] = useState<"single" | "multiple">("single");
  const [duration, setDuration] = useState<"30s" | "1m" | "2m" | "5m" | "manual">("manual");
  const [targetAudience, setTargetAudience] = useState<"all" | "batch" | "course" | "department" | "internship">("all");
  const [targetValue, setTargetValue] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [allowVoteChange, setAllowVoteChange] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selected Poll for Live View / Analytics
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load Polls
  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/admin/polls");
      const data = await res.json();
      if (data.success) {
        setPolls(data.polls);
      } else {
        showToast("error", data.error || "Failed to fetch polls");
      }
    } catch {
      showToast("error", "Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Poll Real-Time Updates Subscription
  useEffect(() => {
    if (!supabase) return;
    
    const pollChannel = supabase.channel("admin-polling-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, () => {
        fetchPolls();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () => {
        fetchPolls();
        if (selectedPollId) {
          fetchAnalytics(selectedPollId);
        }
      })
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(pollChannel);
    };
  }, [selectedPollId]);

  // Load Analytics
  const fetchAnalytics = async (pollId: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/admin/polls/analytics?pollId=${pollId}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        showToast("error", data.error || "Failed to load analytics");
      }
    } catch {
      showToast("error", "Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (selectedPollId) {
      fetchAnalytics(selectedPollId);
    } else {
      setAnalytics(null);
    }
  }, [selectedPollId]);

  // Form Management
  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOpts = [...options];
      newOpts.splice(index, 1);
      setOptions(newOpts);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOpts = [...options];
    newOpts[index] = val;
    setOptions(newOpts);
  };

  const handleCreatePoll = async (status: "draft" | "live") => {
    if (!question.trim()) {
      showToast("error", "Question is required");
      return;
    }
    const cleanOpts = options.map(o => o.trim()).filter(Boolean);
    if (cleanOpts.length < 2) {
      showToast("error", "Provide at least 2 non-empty options");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          type,
          duration,
          targetAudience,
          targetValue: targetAudience === "all" ? null : targetValue,
          allowAnonymous,
          allowVoteChange,
          options: cleanOpts,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `Poll ${status === "live" ? "published" : "saved as draft"}`);
        setQuestion("");
        setOptions(["", ""]);
        setType("single");
        setDuration("manual");
        setTargetAudience("all");
        setTargetValue("");
        setAllowAnonymous(false);
        setAllowVoteChange(false);
        fetchPolls();
      } else {
        showToast("error", data.error || "Failed to create poll");
      }
    } catch {
      showToast("error", "Network error creating poll");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (pollId: string) => {
    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "live" })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Poll published successfully!");
        fetchPolls();
      } else {
        showToast("error", data.error || "Failed to publish poll");
      }
    } catch {
      showToast("error", "Error publishing poll");
    }
  };

  const handleClose = async (pollId: string) => {
    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Poll closed successfully!");
        fetchPolls();
      } else {
        showToast("error", data.error || "Failed to close poll");
      }
    } catch {
      showToast("error", "Error closing poll");
    }
  };

  const handleDuplicate = async (poll: any) => {
    try {
      const res = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${poll.question} (Copy)`,
          type: poll.type,
          duration: poll.duration,
          targetAudience: poll.target_audience,
          targetValue: poll.target_value,
          allowAnonymous: poll.allow_anonymous,
          allowVoteChange: poll.allow_vote_change,
          options: poll.options.map((o: any) => o.option_text),
          status: "draft"
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Poll duplicated as draft");
        fetchPolls();
      } else {
        showToast("error", data.error || "Failed to duplicate poll");
      }
    } catch {
      showToast("error", "Error duplicating poll");
    }
  };

  const handleDelete = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Poll deleted");
        if (selectedPollId === pollId) setSelectedPollId(null);
        fetchPolls();
      } else {
        showToast("error", data.error || "Failed to delete poll");
      }
    } catch {
      showToast("error", "Error deleting poll");
    }
  };

  // Export Data
  const exportCSV = () => {
    if (!analytics) return;
    const poll = analytics.poll;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Question,${poll.question}\n`;
    csvContent += `Type,${poll.type}\n`;
    csvContent += `Published At,${poll.published_at || "N/A"}\n`;
    csvContent += `Closed At,${poll.closed_at || "N/A"}\n`;
    csvContent += `Total Eligible,${analytics.totalParticipants}\n`;
    csvContent += `Votes Received,${analytics.votesReceived}\n\n`;

    csvContent += "Option,Votes,Percentage\n";
    analytics.options.forEach((opt: any) => {
      csvContent += `"${opt.text}",${opt.votes},${opt.percentage}%\n`;
    });

    csvContent += "\nNon-Responders:\nName,Enrollment,Email\n";
    analytics.notResponded.forEach((std: any) => {
      csvContent += `"${std.name}",${std.enrollment},${std.email}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `poll_analytics_${poll.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = async () => {
    if (!analytics) return;
    showToast("success", "Generating Excel file...");
    try {
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Poll Analytics");

      sheet.addRow(["Poll Question:", analytics.poll.question]);
      sheet.addRow(["Total Participants:", analytics.totalParticipants]);
      sheet.addRow(["Total Votes Received:", analytics.votesReceived]);
      sheet.addRow(["Participation %:", `${analytics.participationPercent}%`]);
      sheet.addRow([]);

      sheet.addRow(["Option Text", "Votes Count", "Percentage"]);
      analytics.options.forEach((opt: any) => {
        sheet.addRow([opt.text, opt.votes, `${opt.percentage}%`]);
      });

      sheet.addRow([]);
      sheet.addRow(["Non-Responders List:"]);
      sheet.addRow(["Student Name", "Enrollment Number", "Email ID"]);
      analytics.notResponded.forEach((std: any) => {
        sheet.addRow([std.name, std.enrollment, std.email]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `poll_analytics_${analytics.poll.id}.xlsx`;
      link.click();
    } catch (err) {
      exportCSV();
    }
  };

  const exportPDF = () => {
    if (!analytics) return;
    window.print();
  };

  return (
    <div className="polls-admin-container" style={{ color: "#1f2937", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", padding: "12px" }}>
      {/* LEFT COLUMN: Creator + Active list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Creator Card */}
        <div className="premium-glass-card" style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 0, 0, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#b45309", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚡</span> Create Live Poll
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>Poll Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter poll question..."
                style={{ width: "100%", height: "80px", background: "#ffffff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "12px", color: "#1f2937", outline: "none", fontSize: "14px", resize: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>Options</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      style={{ flex: 1, background: "#ffffff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "10px 12px", color: "#1f2937", outline: "none", fontSize: "14px" }}
                    />
                    {options.length > 2 && (
                      <button onClick={() => handleRemoveOption(idx)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "#ef4444", borderRadius: "12px", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button onClick={handleAddOption} style={{ marginTop: "8px", background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(0,0,0,0.15)", borderRadius: "12px", width: "100%", padding: "10px", color: "#4b5563", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>+ Add Option</button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>Choice Type</label>
                <select value={type} onChange={(e: any) => setType(e.target.value)} style={{ width: "100%", background: "#ffffff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "10px", color: "#1f2937", outline: "none" }}>
                  <option value="single">Single Choice</option>
                  <option value="multiple">Multiple Choice</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>Timer Duration</label>
                <select value={duration} onChange={(e: any) => setDuration(e.target.value)} style={{ width: "100%", background: "#ffffff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "10px", color: "#1f2937", outline: "none" }}>
                  <option value="30s">30 seconds</option>
                  <option value="1m">1 minute</option>
                  <option value="2m">2 minutes</option>
                  <option value="5m">5 minutes</option>
                  <option value="manual">Manual Close</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>Target Audience</label>
                <select value={targetAudience} onChange={(e: any) => setTargetAudience(e.target.value)} style={{ width: "100%", background: "#ffffff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "10px", color: "#1f2937", outline: "none" }}>
                  <option value="all">All Students</option>
                  <option value="batch">Particular Batch</option>
                  <option value="course">Particular Course</option>
                  <option value="department">Particular Department</option>
                  <option value="internship">Internship Students</option>
                </select>
              </div>
              {targetAudience !== "all" && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>Target Match Value</label>
                  <input
                    type="text"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g. CS, 1st Year, Sec A"
                    style={{ width: "100%", background: "#ffffff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "12px", padding: "10px 12px", color: "#1f2937", outline: "none", fontSize: "14px" }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1f2937", cursor: "pointer", fontWeight: 600 }}>
                <input type="checkbox" checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#b45309" }} />
                Allow Anonymous Voting
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1f2937", cursor: "pointer", fontWeight: 600 }}>
                <input type="checkbox" checked={allowVoteChange} onChange={(e) => setAllowVoteChange(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#b45309" }} />
                Allow Vote Change
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
              <button
                disabled={submitting}
                onClick={() => handleCreatePoll("draft")}
                style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px", padding: "12px", color: "#1f2937", fontWeight: 700, cursor: "pointer" }}
              >
                Save as Draft
              </button>
              <button
                disabled={submitting}
                onClick={() => handleCreatePoll("live")}
                style={{ background: "#FFD446", border: "none", borderRadius: "12px", padding: "12px", color: "#000", fontWeight: 800, cursor: "pointer" }}
              >
                Publish Instantly 🚀
              </button>
            </div>
          </div>
        </div>

        {/* Poll List Card */}
        <div className="premium-glass-card" style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 0, 0, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#1f2937" }}>
            <span>Poll History &amp; List</span>
            <span style={{ fontSize: "12px", background: "rgba(0,0,0,0.05)", padding: "4px 8px", borderRadius: "12px", color: "#4b5563" }}>{polls.length} Total</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
            {polls.length === 0 ? (
              <div style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No polls created yet.</div>
            ) : (
              polls.map((poll) => (
                <div key={poll.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: selectedPollId === poll.id ? "rgba(251, 191, 36, 0.1)" : "rgba(0,0,0,0.02)", border: selectedPollId === poll.id ? "1px solid #FFD446" : "1px solid rgba(0,0,0,0.05)", borderRadius: "16px", padding: "16px", cursor: "pointer" }} onClick={() => setSelectedPollId(poll.id)}>
                  <div style={{ flex: 1, marginRight: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", fontWeight: 800, background: poll.status === "live" ? "#10b981" : poll.status === "closed" ? "#ef4444" : "#6b7280", color: "#fff" }}>
                        {poll.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", color: "#4b5563" }}>
                        {poll.type === "single" ? "Single Choice" : "Multiple Choice"}
                      </span>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", color: "#4b5563" }}>
                        Audience: {poll.target_audience.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937", marginBottom: "4px" }}>{poll.question}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      {poll.votes?.length || 0} votes • Created {new Date(poll.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                    {poll.status === "draft" && (
                      <button onClick={() => handlePublish(poll.id)} title="Publish" style={{ background: "rgba(16, 185, 129, 0.15)", border: "none", color: "#10b981", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Publish</button>
                    )}
                    {poll.status === "live" && (
                      <button onClick={() => handleClose(poll.id)} title="Close Poll" style={{ background: "rgba(239, 68, 68, 0.15)", border: "none", color: "#ef4444", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Close</button>
                    )}
                    <button onClick={() => handleDuplicate(poll)} title="Duplicate" style={{ background: "rgba(0,0,0,0.05)", border: "none", color: "#1f2937", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px" }}>📋</button>
                    <button onClick={() => handleDelete(poll.id)} title="Delete" style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "#ef4444", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Live View & Analytics */}
      <div>
        {loadingAnalytics ? (
          <div className="premium-glass-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "400px" }}>
            <div style={{ color: "#b45309", fontWeight: "bold" }}>Loading analytics in real-time...</div>
          </div>
        ) : analytics ? (
          <div className="premium-glass-card" style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 0, 0, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header Summary */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#b45309", fontWeight: 800 }}>Live Results &amp; Analytics</span>
                <h3 style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", color: "#1f2937" }}>{analytics.poll.question}</h3>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={exportExcel} style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "8px", padding: "6px 12px", color: "#10b981", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Excel</button>
                <button onClick={exportCSV} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "6px 12px", color: "#1f2937", fontSize: "12px", cursor: "pointer" }}>CSV</button>
                <button onClick={exportPDF} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "6px 12px", color: "#1f2937", fontSize: "12px", cursor: "pointer" }}>Print PDF</button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Target Population</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#1f2937", marginTop: "4px" }}>{analytics.totalParticipants}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Votes Received</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#b45309", marginTop: "4px" }}>{analytics.votesReceived}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Participation Pct</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#10b981", marginTop: "4px" }}>{analytics.participationPercent}%</div>
              </div>
            </div>

            {/* Live Progress Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", color: "#6b7280" }}>Option Distribution</h4>
              {analytics.options.map((opt: any) => (
                <div key={opt.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#1f2937" }}>
                    <span style={{ fontWeight: 600 }}>{opt.text}</span>
                    <span style={{ fontWeight: 800 }}>{opt.votes} votes ({opt.percentage}%)</span>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.05)", height: "10px", borderRadius: "5px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ background: "#FFD446", width: `${opt.percentage}%`, height: "100%", borderRadius: "5px", transition: "width 0.4s ease-out" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Bar Chart */}
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.options} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="text" stroke="#4b5563" fontSize={11} />
                  <YAxis stroke="#4b5563" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", color: "#1f2937" }} />
                  <Bar dataKey="votes" fill="#FFD446" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Key Analytics Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(0,0,0,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(0,0,0,0.05)", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#6b7280" }}>Most Selected Option:</span>
                <div style={{ fontWeight: 700, color: "#10b981", marginTop: "4px" }}>{analytics.mostSelected ? `${analytics.mostSelected.text} (${analytics.mostSelected.votes} votes)` : "N/A"}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Least Selected Option:</span>
                <div style={{ fontWeight: 700, color: "#ef4444", marginTop: "4px" }}>{analytics.leastSelected ? `${analytics.leastSelected.text} (${analytics.leastSelected.votes} votes)` : "N/A"}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Average Response Time:</span>
                <div style={{ fontWeight: 700, color: "#1f2937", marginTop: "4px" }}>{analytics.avgResponseTimeSec} seconds</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Non-Responders:</span>
                <div style={{ fontWeight: 700, color: "#b45309", marginTop: "4px" }}>{analytics.notResponded.length} students</div>
              </div>
            </div>

            {/* Non-Responders list */}
            {analytics.notResponded.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", color: "#6b7280" }}>Pending Responders ({analytics.notResponded.length})</h4>
                <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "8px", fontSize: "12px", background: "rgba(0,0,0,0.01)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <th style={{ padding: "8px 12px", color: "#4b5563" }}>Name</th>
                        <th style={{ padding: "8px 12px", color: "#4b5563" }}>Enrollment</th>
                        <th style={{ padding: "8px 12px", color: "#4b5563" }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.notResponded.map((std: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.02)" }}>
                          <td style={{ padding: "8px 12px", color: "#1f2937", fontWeight: 600 }}>{std.name}</td>
                          <td style={{ padding: "8px 12px", color: "#4b5563" }}>{std.enrollment}</td>
                          <td style={{ padding: "8px 12px", color: "#4b5563" }}>{std.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="premium-glass-card" style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 0, 0, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "400px", color: "#9ca3af", textAlign: "center" }}>
            <span style={{ fontSize: "48px", marginBottom: "12px" }}>📊</span>
            <h3 style={{ color: "#4b5563" }}>Select a poll from the list to see real-time analytics.</h3>
            <p style={{ fontSize: "13px", marginTop: "6px", color: "#6b7280" }}>Vote counts and participation metrics update instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
