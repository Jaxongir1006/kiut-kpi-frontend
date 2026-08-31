import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MessageSquare, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Loader2, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";
import ProtectedFileLink from "@/components/shared/ProtectedFileLink";
import { format } from "date-fns";
import { fetchAppeals, reviewAppeal } from "@/features/appeals/appealsSlice";
import { useToast } from "@/components/ui/use-toast";

const STATUS_CFG = {
  pending:  { label: "Ko'rib chiqilmoqda", cls: "bg-yellow-100 text-yellow-700 border-yellow-200",   border: "border-l-yellow-400"  },
  resolved: { label: "Hal qilindi",        cls: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "border-l-emerald-400" },
  rejected: { label: "Rad etildi",         cls: "bg-red-100 text-red-600 border-red-200",            border: "border-l-red-400"     },
};

const SUBMISSION_STATUSES = [
  { value: "",           label: "O'zgartirmaslik" },
  { value: "approved",  label: "Tasdiqlangan" },
  { value: "rejected",  label: "Rad etilgan" },
  { value: "overridden", label: "Override qilingan" },
];

const TABS = [
  { key: "all",      label: "Barchasi" },
  { key: "pending",  label: "Kutilmoqda" },
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

function ReviewDialog({ appeal, open, onClose }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { isReviewing } = useSelector((s) => s.appeals);

  const [status, setStatus]                   = useState("resolved");
  const [reviewComments, setReviewComments]   = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [pointsOverride, setPointsOverride]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status || !reviewComments.trim()) return;

    const data = { status, review_comments: reviewComments.trim() };
    if (submissionStatus) data.submission_status = submissionStatus;
    if (pointsOverride !== "") data.points_override = parseFloat(pointsOverride);

    const result = await dispatch(reviewAppeal({ id: appeal.id, data }));
    if (reviewAppeal.fulfilled.match(result)) {
      toast({ title: "Apellyatsiya ko'rib chiqildi", description: "Status yangilandi." });
      onClose();
    } else {
      toast({
        title: "Xatolik",
        description: result.payload || "Ko'rib bo'lmadi.",
        variant: "destructive",
      });
    }
  };

  if (!appeal) return null;
  const title = appeal.submission_details?.title || "Topshiriq";
  const teacherName = appeal.teacher_details?.full_name
    || appeal.teacher_name
    || "O'qituvchi";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apellyatsiyani ko'rib chiqish</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
          <p><span className="font-medium">O'qituvchi:</span> {teacherName}</p>
          <p><span className="font-medium">Topshiriq:</span> {title}</p>
          <p><span className="font-medium">Sabab:</span> {appeal.reason}</p>
          {appeal.attachment && (
            <ProtectedFileLink url={appeal.attachment} className="text-xs">
              Biriktirmani ko'rish
            </ProtectedFileLink>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Decision */}
          <div className="space-y-1.5">
            <Label>Qaror <span className="text-red-500">*</span></Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">Hal qilindi (qabul)</SelectItem>
                <SelectItem value="rejected">Rad etildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Review comments */}
          <div className="space-y-1.5">
            <Label>Izoh <span className="text-red-500">*</span></Label>
            <Textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="O'qituvchiga javob yozing..."
              rows={3}
              required
            />
          </div>

          {/* Optional: change submission status */}
          <div className="space-y-1.5">
            <Label>Topshiriq holatini o'zgartirish (ixtiyoriy)</Label>
            <Select value={submissionStatus} onValueChange={setSubmissionStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_STATUSES.map((s) => (
                  <SelectItem key={s.value || "__none__"} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional: points override */}
          <div className="space-y-1.5">
            <Label>Ball o'zgartirish (ixtiyoriy)</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={pointsOverride}
              onChange={(e) => setPointsOverride(e.target.value)}
              placeholder="Yangi ball miqdori..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={!reviewComments.trim() || isReviewing}
              variant={status === "rejected" ? "destructive" : "default"}
            >
              {isReviewing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {status === "rejected" ? "Rad etish" : "Tasdiqlash"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AppealRow({ appeal, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const borderCls = STATUS_CFG[appeal.status]?.border || "border-l-gray-300";

  const title = appeal.submission_details?.title || "Topshiriq";
  const teacherName = appeal.teacher_details?.full_name
    || appeal.teacher_name
    || "—";
  const dept = appeal.teacher_details?.department_details?.name
    || appeal.department_name
    || "";

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl overflow-hidden",
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
              <p className="text-xs text-muted-foreground mt-0.5">
                {teacherName}{dept ? ` · ${dept}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={appeal.status} />
              {appeal.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => { e.stopPropagation(); onReview(appeal); }}
                >
                  Ko'rib chiqish
                </Button>
              )}
              {expanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
            {appeal.created_at && (
              <span>Yuborilgan: {format(new Date(appeal.created_at), "dd.MM.yyyy")}</span>
            )}
            {appeal.reviewed_at && (
              <span>Ko'rilgan: {format(new Date(appeal.reviewed_at), "dd.MM.yyyy")}</span>
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
          {appeal.review_comments && (
            <div className={cn(
              "rounded-lg p-3",
              appeal.status === "resolved"
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            )}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Komissiya javobi
              </p>
              <p className="text-sm">{appeal.review_comments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAppeals() {
  const dispatch = useDispatch();
  const { list: appeals, isLoading, error } = useSelector((s) => s.appeals);

  const [activeTab, setActiveTab]   = useState("all");
  const [search, setSearch]         = useState("");
  const [reviewing, setReviewing]   = useState(null);

  useEffect(() => {
    dispatch(fetchAppeals());
  }, [dispatch]);

  const counts = {
    all:      appeals.length,
    pending:  appeals.filter((a) => a.status === "pending").length,
    resolved: appeals.filter((a) => a.status === "resolved").length,
    rejected: appeals.filter((a) => a.status === "rejected").length,
  };

  const filtered = appeals
    .filter((a) => activeTab === "all" || a.status === activeTab)
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const title = (a.submission_details?.title || "").toLowerCase();
      const name  = (a.teacher_details?.full_name || a.teacher_name || "").toLowerCase();
      return title.includes(q) || name.includes(q);
    });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apellyatsiyalar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            O'qituvchilardan kelgan apellyatsiya arizalari
          </p>
        </div>
        {counts.pending > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-sm px-3 py-1">
            {counts.pending} ta kutilmoqda
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Jami",            count: counts.all,      cls: "text-foreground",  bg: "bg-card" },
          { label: "Kutilmoqda",      count: counts.pending,  cls: "text-yellow-600",  bg: "bg-yellow-50 border-yellow-200" },
          { label: "Hal qilindi",     count: counts.resolved, cls: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Rad etildi",      count: counts.rejected, cls: "text-red-500",     bg: "bg-red-50 border-red-200" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex gap-1 border border-border rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
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
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <ErrorState
          title="Apellyatsiyalarni yuklab bo'lmadi"
          error={error}
          onRetry={() => dispatch(fetchAppeals())}
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
          <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Apellyatsiya arizalari yo'q</p>
          <p className="text-xs mt-1">Bu toifada arizalar mavjud emas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appeal) => (
            <AppealRow key={appeal.id} appeal={appeal} onReview={setReviewing} />
          ))}
        </div>
      )}

      {reviewing && (
        <ReviewDialog
          key={reviewing.id}
          appeal={reviewing}
          open
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}
