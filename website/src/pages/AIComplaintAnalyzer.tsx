import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
  Fingerprint,
} from "lucide-react";

interface Complaint {
  id: string;
  user_id: string;
  complaint_type: string;
  message: string;
  status: "pending" | "auto_resolved" | "rejected" | "escalated";
  ai_decision?: string;
  confidence?: number;
  ai_reasoning?: string;
  created_at: any;
}

export default function AIComplaintAnalyzer() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/complaints`);
      const data = await response.json();
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleAnalyze = async (complaintId: string) => {
    setIsAnalyzing(complaintId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/complaints/analyze/${complaintId}`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        // Refresh complaints
        await fetchComplaints();
        if (selectedComplaint?.id === complaintId) {
          const updated = complaints.find(c => c.id === complaintId);
          if (updated) setSelectedComplaint(updated);
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleAnalyzeAll = async () => {
    setIsAnalyzingAll(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/complaints/analyze-all`, {
        method: "POST",
      });
      await response.json();
      await fetchComplaints();
    } catch (error) {
      console.error("Batch analysis failed:", error);
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "auto_resolved": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "escalated": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default: return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "auto_resolved": return <CheckCircle2 className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      case "escalated": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-emerald-400" />
            AI Complaint Analyzer
          </h1>
          <p className="text-neutral-500 mt-1">
            Intelligent resolution system for processing rider claims and grievances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchComplaints}
            className="p-2.5 rounded-xl border border-white/5 bg-[#111111] text-neutral-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzingAll || complaints.filter(c => c.status === "pending").length === 0}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {isAnalyzingAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyze All Pending
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Complaints", value: complaints.length, icon: MessageSquare, color: "blue" },
          { label: "Pending Analysis", value: complaints.filter(c => c.status === "pending").length, icon: Clock, color: "orange" },
          { label: "Auto Resolved", value: complaints.filter(c => c.status === "auto_resolved").length, icon: CheckCircle2, color: "emerald" },
          { label: "Needs Review", value: complaints.filter(c => c.status === "escalated").length, icon: AlertCircle, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
        {/* Filters and Search */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by ID or message..."
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              className="bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="auto_resolved">Auto Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="escalated">Needs Review</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#111111] z-10">
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Message</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">AI Decision</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              <AnimatePresence mode="popLayout">
                {filteredComplaints.map((complaint) => (
                  <motion.tr
                    key={complaint.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedComplaint(complaint)}
                    className={`group hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedComplaint?.id === complaint.id ? "bg-white/[0.03]" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white capitalize">{complaint.complaint_type.replace("_", " ")}</span>
                        <span className="text-[10px] text-neutral-500 font-mono tracking-tighter">ID: {complaint.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-400 line-clamp-1 max-w-sm">{complaint.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        {complaint.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {complaint.ai_decision ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-white">{complaint.ai_decision}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${complaint.confidence && complaint.confidence > 70 ? "bg-emerald-400" : "bg-orange-400"}`}
                                style={{ width: `${complaint.confidence}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-neutral-500">{complaint.confidence}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-600 italic">Not analyzed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {complaint.status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyze(complaint.id);
                          }}
                          disabled={isAnalyzing === complaint.id}
                          className="p-2 rounded-lg border border-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all text-neutral-500"
                        >
                          {isAnalyzing === complaint.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button className="p-2 rounded-lg text-neutral-500 hover:text-white transition-colors ml-2">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No complaints found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Side Panel */}
      <AnimatePresence>
        {selectedComplaint && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComplaint(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0F0F0F] border-l border-white/10 z-[70] shadow-2xl p-8 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${getStatusStyle(selectedComplaint.status)}`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Complaint Details</h2>
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-mono">ID: {selectedComplaint.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Meta Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">User ID</p>
                    <p className="text-sm font-mono text-white truncate">{selectedComplaint.user_id}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">Category</p>
                    <p className="text-sm font-bold text-white capitalize">{selectedComplaint.complaint_type.replace("_", " ")}</p>
                  </div>
                </div>

                {/* Message Section */}
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block mb-3">Rider Message</label>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-neutral-200 leading-relaxed italic">
                    "{selectedComplaint.message}"
                  </div>
                </div>

                {/* AI Analysis Section */}
                <div className="p-6 rounded-3xl bg-neutral-900/50 border border-emerald-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Brain className="w-20 h-20 text-emerald-400" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <Brain className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Analytical Verdict</h3>
                  </div>

                  {selectedComplaint.ai_decision ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">AI Decision</p>
                          <p className="text-2xl font-black text-white">{selectedComplaint.ai_decision}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">Confidence</p>
                          <p className={`text-2xl font-black ${selectedComplaint.confidence && selectedComplaint.confidence > 80 ? "text-emerald-400" : "text-orange-400"}`}>
                            {selectedComplaint.confidence}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Reasoning & logic</p>
                        <p className="text-sm text-neutral-400 leading-relaxed font-medium bg-black/40 p-4 rounded-xl border border-white/5">
                          {selectedComplaint.ai_reasoning}
                        </p>
                      </div>

                      <div className="flex gap-2">
                         <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                           <ShieldCheck className="w-3 h-3" /> Fraud Audited
                         </span>
                         <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                           <TrendingUp className="w-3 h-3" /> Data Correlated
                         </span>
                         <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                           <Fingerprint className="w-3 h-3" /> Identity Verified
                         </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                      <p className="text-neutral-500 text-sm">System is waiting for analysis trigger.</p>
                      <button
                        onClick={() => handleAnalyze(selectedComplaint.id)}
                        disabled={isAnalyzing === selectedComplaint.id}
                        className="mt-4 px-6 py-2 rounded-xl bg-emerald-500 text-black font-bold flex items-center gap-2 mx-auto hover:bg-emerald-400 transition-all disabled:opacity-50"
                      >
                        {isAnalyzing === selectedComplaint.id ? "Analyzing..." : "Trigger AI Analysis"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Action History */}
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-4">Complaint History</p>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="w-px flex-1 bg-white/10" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Complaint filed by rider</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {new Date(selectedComplaint.created_at?.toDate ? selectedComplaint.created_at.toDate() : selectedComplaint.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {selectedComplaint.status !== "pending" && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">AI Analysis Completed</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">Result: {selectedComplaint.ai_decision}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
