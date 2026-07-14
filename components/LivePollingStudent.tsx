import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface LivePollingStudentProps {
  student: any;
  showToast: (type: "success" | "error", message: string) => void;
}

export default function LivePollingStudent({ student, showToast }: LivePollingStudentProps) {
  const [livePolls, setLivePolls] = useState<any[]>([]);
  const [completedPolls, setCompletedPolls] = useState<any[]>([]);
  const [missedPolls, setMissedPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "completed" | "missed">("live");

  const [selectedVotes, setSelectedVotes] = useState<{ [pollId: string]: string[] }>({});
  const [submittingVote, setSubmittingVote] = useState<{ [pollId: string]: boolean }>({});
  const [newPollPopup, setNewPollPopup] = useState<any | null>(null);
  const [now, setNow] = useState(Date.now());

  const enrollment = student.enrollmentNumber || student.enrollment_number || "";

  const fetchData = async () => {
    if (!enrollment) return;
    try {
      const [liveRes, histRes] = await Promise.all([
        fetch(`/api/polls/live?enrollmentNumber=${enrollment}`),
        fetch(`/api/polls/history?enrollmentNumber=${enrollment}`)
      ]);

      const liveData = await liveRes.json();
      const histData = await histRes.json();

      if (liveData.success) {
        setLivePolls(liveData.polls);
      }
      if (histData.success) {
        setCompletedPolls(histData.completed);
        setMissedPolls(histData.missed);
      }
    } catch {
      console.warn("Failed to fetch polling data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [enrollment]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel("student-polling-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, (payload) => {
        fetchData();

        if (payload.eventType === "INSERT" || (payload.eventType === "UPDATE" && payload.new.status === "live")) {
          const newPoll = payload.new;
          const aud = newPoll.target_audience;
          const val = (newPoll.target_value || "").toLowerCase().trim();
          const sBranch = (student.branch || "").toLowerCase().trim();
          const sYear = (student.year_of_study || student.yearOfStudy || "").toLowerCase().trim();
          const sSection = (student.section_class || student.sectionClass || "").toLowerCase().trim();

          let isTargeted = aud === "all";
          if (!isTargeted && val) {
            if (aud === "batch") isTargeted = sYear.includes(val);
            if (aud === "course") isTargeted = sSection.includes(val);
            if (aud === "department") isTargeted = sBranch.includes(val);
            if (aud === "internship") isTargeted = sBranch.includes(val);
          }

          if (isTargeted) {
            setNewPollPopup(newPoll);
            showToast("success", "📢 New Live Poll Published!");
            setTimeout(() => {
              setNewPollPopup(null);
            }, 12000);
          }
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [student]);

  const handleVoteSubmit = async (pollId: string) => {
    const votes = selectedVotes[pollId] || [];
    if (votes.length === 0) {
      showToast("error", "Please select at least one option");
      return;
    }

    setSubmittingVote(prev => ({ ...prev, [pollId]: true }));
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentNumber: enrollment,
          optionIds: votes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Vote submitted!");
        fetchData();
      } else {
        showToast("error", data.error || "Failed to submit vote");
      }
    } catch {
      showToast("error", "Error submitting vote");
    } finally {
      setSubmittingVote(prev => ({ ...prev, [pollId]: false }));
    }
  };

  const handleSelectOption = (pollId: string, optionId: string, isMultiple: boolean) => {
    const current = selectedVotes[pollId] || [];
    if (isMultiple) {
      if (current.includes(optionId)) {
        setSelectedVotes(prev => ({ ...prev, [pollId]: current.filter(id => id !== optionId) }));
      } else {
        setSelectedVotes(prev => ({ ...prev, [pollId]: [...current, optionId] }));
      }
    } else {
      setSelectedVotes(prev => ({ ...prev, [pollId]: [optionId] }));
    }
  };

  const renderTimer = (poll: any) => {
    if (poll.duration === "manual") return <span style={{ color: "#10b981", fontWeight: 800 }}>LIVE</span>;

    let durationMs = 0;
    if (poll.duration === "30s") durationMs = 30 * 1000;
    else if (poll.duration === "1m") durationMs = 60 * 1000;
    else if (poll.duration === "2m") durationMs = 120 * 1000;
    else if (poll.duration === "5m") durationMs = 300 * 1000;

    const publishedAt = new Date(poll.publishedAt).getTime();
    const expiry = publishedAt + durationMs;
    const remainingSecs = Math.max(0, Math.floor((expiry - now) / 1000));

    const mm = String(Math.floor(remainingSecs / 60)).padStart(2, "0");
    const ss = String(remainingSecs % 60).padStart(2, "0");

    if (remainingSecs === 0) {
      return <span style={{ color: "#ef4444", fontWeight: 800 }}>EXPIRED</span>;
    }

    return (
      <span style={{ color: "#b45309", fontFamily: "monospace", fontWeight: 800, fontSize: "16px" }}>
        ⏱️ {mm}:{ss}
      </span>
    );
  };

  const totalRespondedCount = completedPolls.length;
  const pollingBadge = 
    totalRespondedCount >= 10 ? "Polling Overlord 👑" :
    totalRespondedCount >= 5 ? "Active Citizen 🎖️" :
    totalRespondedCount >= 1 ? "Informed Rookie 🔰" : "No badge yet";

  return (
    <div className="polls-student-view" style={{ color: "#1f2937", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Animated notification toast/drawer */}
      {newPollPopup && (
        <div style={{
          position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
          background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)",
          border: "2px solid #FFD446", borderRadius: "16px",
          padding: "20px", width: "320px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          animation: "slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#b45309", fontWeight: 800, fontSize: "12px", textTransform: "uppercase" }}>📢 New Live Poll</span>
            <button onClick={() => setNewPollPopup(null)} style={{ border: "none", background: "none", color: "#1f2937", cursor: "pointer", fontWeight: "bold" }}>×</button>
          </div>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px", color: "#1f2937" }}>{newPollPopup.question}</div>
          <button
            onClick={() => {
              setActiveTab("live");
              setNewPollPopup(null);
            }}
            style={{ width: "100%", background: "#FFD446", border: "none", borderRadius: "8px", padding: "10px", color: "#000", fontWeight: 800, cursor: "pointer" }}
          >
            Vote Now
          </button>
        </div>
      )}

      {/* Badges and summary card */}
      <div className="premium-glass-card" style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "24px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1f2937" }}>My Polling Status</h3>
          <p style={{ fontSize: "12px", color: "#6b7280" }}>Participate in polls to earn badges and XP rewards</p>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>Voted Polls</span>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#1f2937" }}>{totalRespondedCount}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>Participation Badge</span>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#b45309" }}>{pollingBadge}</div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "8px" }}>
        <button
          onClick={() => setActiveTab("live")}
          style={{ background: "none", border: "none", color: activeTab === "live" ? "#b45309" : "#6b7280", fontWeight: 800, cursor: "pointer", padding: "8px 12px", borderBottom: activeTab === "live" ? "2px solid #b45309" : "none" }}
        >
          Active Polls ({livePolls.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          style={{ background: "none", border: "none", color: activeTab === "completed" ? "#b45309" : "#6b7280", fontWeight: 800, cursor: "pointer", padding: "8px 12px", borderBottom: activeTab === "completed" ? "2px solid #b45309" : "none" }}
        >
          Completed ({completedPolls.length})
        </button>
        <button
          onClick={() => setActiveTab("missed")}
          style={{ background: "none", border: "none", color: activeTab === "missed" ? "#b45309" : "#6b7280", fontWeight: 800, cursor: "pointer", padding: "8px 12px", borderBottom: activeTab === "missed" ? "2px solid #b45309" : "none" }}
        >
          Missed ({missedPolls.length})
        </button>
      </div>

      {/* TABS PANELS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {loading ? (
          <div style={{ textAlign: "center", color: "#b45309", padding: "40px" }}>Syncing live polls...</div>
        ) : activeTab === "live" ? (
          livePolls.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>No active polls currently available.</div>
          ) : (
            livePolls.map((poll) => {
              const isMultiple = poll.type === "multiple";
              const userSelections = selectedVotes[poll.id] || [];
              const isSubmitting = submittingVote[poll.id] || false;

              return (
                <div key={poll.id} className="premium-glass-card" style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 0, 0, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", marginRight: "6px", fontWeight: 800, color: "#4b5563" }}>
                        {poll.type === "single" ? "Single Choice" : "Multiple Choice"}
                      </span>
                      {poll.allowVoteChange && (
                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontWeight: 800 }}>
                          Vote Change Enabled
                        </span>
                      )}
                    </div>
                    {renderTimer(poll)}
                  </div>

                  <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px", color: "#1f2937" }}>{poll.question}</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    {poll.options.map((opt: any) => {
                      const isSelected = userSelections.includes(opt.id) || (poll.hasVoted && opt.isVotedByMe);
                      const showResults = poll.hasVoted;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (!poll.hasVoted || poll.allowVoteChange) {
                              handleSelectOption(poll.id, opt.id, isMultiple);
                            }
                          }}
                          style={{
                            position: "relative",
                            background: isSelected ? "rgba(251, 191, 36, 0.08)" : "rgba(0,0,0,0.02)",
                            border: isSelected ? "1px solid #FFD446" : "1px solid rgba(0,0,0,0.08)",
                            borderRadius: "12px",
                            padding: "16px",
                            cursor: (!poll.hasVoted || poll.allowVoteChange) ? "pointer" : "default",
                            overflow: "hidden",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          {showResults && (
                            <div style={{
                              position: "absolute", left: 0, top: 0, bottom: 0,
                              background: isSelected ? "rgba(251, 191, 36, 0.15)" : "rgba(0,0,0,0.04)",
                              width: `${opt.percentage}%`,
                              zIndex: 0,
                              transition: "width 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)"
                            }} />
                          )}

                          <span style={{ zIndex: 1, fontWeight: isSelected ? 800 : 500, color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
                            {!poll.hasVoted || poll.allowVoteChange ? (
                              <span style={{ width: "18px", height: "18px", borderRadius: isMultiple ? "4px" : "50%", border: "2px solid rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isSelected && <span style={{ width: "10px", height: "10px", borderRadius: isMultiple ? "2px" : "50%", background: "#b45309" }} />}
                              </span>
                            ) : null}
                            {opt.text}
                          </span>

                          {showResults && (
                            <span style={{ zIndex: 1, fontWeight: 800, color: "#1f2937" }}>
                              {opt.votes} votes ({opt.percentage}%)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(!poll.hasVoted || poll.allowVoteChange) && (
                    <button
                      disabled={isSubmitting || userSelections.length === 0}
                      onClick={() => handleVoteSubmit(poll.id)}
                      style={{
                        width: "100%",
                        background: "#FFD446",
                        border: "none",
                        borderRadius: "12px",
                        padding: "12px",
                        color: "#000",
                        fontWeight: 800,
                        cursor: "pointer",
                        opacity: userSelections.length === 0 ? 0.5 : 1
                      }}
                    >
                      {isSubmitting ? "Submitting Vote..." : poll.hasVoted ? "Change Vote 🔄" : "Submit Vote 🗳️"}
                    </button>
                  )}

                  {poll.hasVoted && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280" }}>
                      <span>Total Votes Received: {poll.totalVotes}</span>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Vote Registered</span>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : activeTab === "completed" ? (
          completedPolls.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>You haven't participated in any polls yet.</div>
          ) : (
            completedPolls.map((poll) => (
              <div key={poll.id} className="premium-glass-card" style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 0, 0, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 800 }}>✓ Voted</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Closed {new Date(poll.closedAt || poll.publishedAt).toLocaleDateString()}</span>
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "12px", color: "#1f2937" }}>{poll.question}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {poll.options.map((opt: any) => {
                    const isSelected = poll.myVotes.includes(opt.id);
                    return (
                      <div key={opt.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 12px", borderRadius: "8px", background: isSelected ? "rgba(251, 191, 36, 0.08)" : "rgba(0,0,0,0.02)", border: isSelected ? "1px solid #FFD446" : "1px solid transparent" }}>
                        <span style={{ fontWeight: isSelected ? 700 : 500, color: "#1f2937" }}>{opt.text} {isSelected && "🎯"}</span>
                        <span style={{ fontWeight: 800, color: "#1f2937" }}>{opt.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )
        ) : (
          missedPolls.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>No missed polls! Good job staying active.</div>
          ) : (
            missedPolls.map((poll) => (
              <div key={poll.id} className="premium-glass-card" style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 0, 0, 0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 800 }}>⚠ Missed</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Closed {new Date(poll.closedAt || poll.publishedAt).toLocaleDateString()}</span>
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "12px", color: "#1f2937" }}>{poll.question}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {poll.options.map((opt: any) => (
                    <div key={opt.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.02)" }}>
                      <span style={{ color: "#1f2937" }}>{opt.text}</span>
                      <span style={{ fontWeight: 800, color: "#1f2937" }}>{opt.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        )}
        
      </div>

    </div>
  );
}
