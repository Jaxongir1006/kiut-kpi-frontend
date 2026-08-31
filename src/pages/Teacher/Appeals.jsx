import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MessageSquare, Clock, CheckCircle2, XCircle, ChevronDown,
  ChevronUp, Plus, Loader2, Paperclip, X, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ProtectedFileLink from "@/components/shared/ProtectedFileLink";
import { format } from "date-fns";
import { fetchAppeals, createAppeal } from "@/features/appeals/appealsSlice";
import { fetchSubmissions } from "@/features/submissions/submissionsSlice";
import { useToast } from "@/components/ui/use-toast";

const STATUS_CFG = {
  pending:  { label: "Ko'rib chiqilmoqda", cls: "bg-yellow-100 text-yellow-700 border-yellow-200",  border: "border-l-yellow-400"  },
  resolved: { label: "Hal qilindi",        cls: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "border-l-emerald-400" },
  rejected: { label: "Rad etildi",         cls: "bg-red-100 text-red-600 border-red-200",            border: "border-l-red-400"     },
};

const TABS = [
  { key: "all",      label: "Barchasi" },
  { key: "pending",  label: "Ko'rib chiqilmoqda" },
  { key: "resolved", label: "Hal qilindi" },
  { key: "rejected", label: "Rad etildi" },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <Badge variant="secondary" className={`border ${cfg.cls} text-xs font-medium`}>
      {cfg.label}
    </Badge>
  );
}

function StatusIcon({ status }) {
  if (status === "resolved") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === "rejected") return <XCircle className="w-5 h-5 text-red-500" />;
  return <Clock className="w-5 h-5 text-yellow-500" />;
}

function AppealCard({ appeal }) {
  const [expanded, setExpanded] = useState(false);
  const borderCls = STATUS_CFG[appeal.status]?.border || "border-l-gray-300";

  const title = appeal.submission_details?.title || appeal.submission_title || "Topshiriq";
  const activityType = appeal.submission_details?.activity_type_name
    || appeal.submission_details?.category_name
    || "";
  const pointsRequested = appeal.submission_details?.points ?? appeal.points_requested ?? "—";
  const pointsGranted = appeal.submission_details?.points_override ?? appeal.points_granted;

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl overflow-hidden transition-all",
      `border-l-4 ${borderCls}`
    )}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={appeal.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm line-clamp-1">{title}</p>
              {activityType && (
                <p className="text-xs text-muted-foreground mt-0.5">{activityType}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={appeal.status} />
              {expanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
            <span>So'ralgan ball: <span className="font-semibold text-foreground">{pointsRequested}</span></span>
            {pointsGranted != null && (
              <span>Berilgan ball:{" "}
                <span className={cn("font-semibold", Number(pointsGranted) > 0 ? "text-emerald-600" : "text-red-500")}>
                  {pointsGranted}
                </span>
              </span>
            )}
            {appeal.created_at && (
              <span>{format(new Date(appeal.created_at), "dd.MM.yyyy")}</span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Apellyatsiya sababi
            </p>
            <p className="text-sm">{appeal.reason}</p>
          </div>

          {appeal.attachment && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Biriktirma
              </p>
              <ProtectedFileLink
                url={appeal.attachment}
                className="text-sm"
                icon={<Paperclip className="w-3.5 h-3.5 shrink-0" />}
              >
                Faylni ko'rish
              </ProtectedFileLink>
            </div>
          )}

          {appeal.review_comments && (
            <div className={cn(
              "rounded-lg p-3",
              appeal.status === "resolved"
                ? "bg-emerald-50 border border-emerald-200"
                : appeal.status === "rejected"
                ? "bg-red-50 border border-red-200"
                : "bg-muted"
            )}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Komissiya javobi
              </p>
              <p className="text-sm">{appeal.review_comments}</p>
              {appeal.reviewed_at && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {format(new Date(appeal.reviewed_at), "dd.MM.yyyy HH:mm")}
                </p>
              )}
            </div>
          )}

          {appeal.status === "pending" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                Apellyatsiyangiz ko'rib chiqilmoqda. Komissiya javobi tez orada beriladi.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Appeals() {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { list: appeals, isLoading, isSaving } = useSelector((s) => s.appeals);
  const { list: submissions } = useSelector((s) => s.submissions);

  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm]   = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [reason, setReason]       = useState("");
  const [file, setFile]           = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAppeals());
    dispatch(fetchSubmissions());
  }, [dispatch]);

  const filtered = activeTab === "all"
    ? appeals
    : appeals.filter((a) => a.status === activeTab);

  const counts = {
    all:      appeals.length,
    pending:  appeals.filter((a) => a.status === "pending").length,
    resolved: appeals.filter((a) => a.status === "resolved").length,
    rejected: appeals.filter((a) => a.status === "rejected").length,
  };

  const closeForm = () => {
    setShowForm(false);
    setSubmissionId("");
    setReason("");
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionId || !reason.trim()) return;

    const fd = new FormData();
    fd.append("submission", submissionId);
    fd.append("reason", reason.trim());
    if (file) fd.append("attachment", file);

    const result = await dispatch(createAppeal(fd));
    if (createAppeal.fulfilled.match(result)) {
      toast({ title: "Apellyatsiya yuborildi", description: "Komissiya ko'rib chiqadi." });
      closeForm();
      dispatch(fetchAppeals());
    } else {
      toast({
        title: "Xatolik",
        description: result.payload || "Apellyatsiya yuborilib bo'lmadi.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apellyatsiyalar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            KPI natijalari bo'yicha apellyatsiya arizalaringiz
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Apellyatsiya yuborish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Jami",               count: counts.all,      cls: "text-foreground",   bg: "bg-card" },
          { label: "Ko'rib chiqilmoqda", count: counts.pending,  cls: "text-yellow-600",   bg: "bg-yellow-50 border-yellow-200" },
          { label: "Hal qilindi",        count: counts.resolved, cls: "text-emerald-600",  bg: "bg-emerald-50 border-emerald-200" },
          { label: "Rad etildi",         count: counts.rejected, cls: "text-red-500",      bg: "bg-red-50 border-red-200" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border border-border rounded-lg p-1 w-fit mb-5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full",
                activeTab === tab.key ? "bg-white/20" : "bg-muted text-muted-foreground"
              )}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
          <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Apellyatsiya arizalari yo'q</p>
          <p className="text-xs mt-1">Bu toifada arizalar mavjud emas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appeal) => (
            <AppealCard key={appeal.id} appeal={appeal} />
          ))}
        </div>
      )}

      {/* New appeal dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { if (!v) closeForm(); else setShowForm(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apellyatsiya yuborish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                Apellyatsiya faqat rad etilgan yoki noto'g'ri baholangan topshiriqlar uchun
                yuborilishi mumkin. Muddati: topshiriq rad etilganidan keyin{" "}
                <strong>10 ish kuni</strong> ichida.
              </p>
            </div>

            {/* Submission selector */}
            <div className="space-y-1.5">
              <Label>Topshiriq tanlang <span className="text-red-500">*</span></Label>
              <Select value={submissionId} onValueChange={setSubmissionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Topshiriqni tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {submissions.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Topshiriqlar topilmadi
                    </SelectItem>
                  ) : (
                    submissions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        <span className="line-clamp-1">
                          {sub.title || sub.activity_title || sub.id}
                          {sub.status && (
                            <span className="ml-2 text-muted-foreground text-xs">
                              ({sub.status})
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label>Apellyatsiya sababi <span className="text-red-500">*</span></Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nima sababdan apellyatsiya yuboryapsiz? Dalillaringizni batafsil yozing..."
                rows={4}
                required
              />
            </div>

            {/* File attachment */}
            <div className="space-y-1.5">
              <Label>Biriktirma (ixtiyoriy)</Label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center gap-2 p-2.5 border border-border rounded-lg bg-muted/40">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" /> Fayl biriktirish
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={closeForm}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={!submissionId || !reason.trim() || isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Yuborish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
