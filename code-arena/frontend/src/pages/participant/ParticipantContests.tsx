// frontend/src/pages/participant/ParticipantContests.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  ExternalLink,
  Swords,
  Clock,
  Calendar,
  CheckCircle,
  Video,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { LoadingState, ErrorState } from "../../components/common";
import { contestApi } from "../../services/contestApi";
import type { Contest, VideoSubmission } from "../../types";
import "./ParticipantContests.css";

interface ContestWithParticipation extends Contest {
  _participation: {
    registrationStatus: "APPROVED" | "PENDING" | "REJECTED" | "NONE";
    confirmedJoined: boolean;
    canSubmitVideo: boolean;
    submission: VideoSubmission | null;
  };
}

export const ParticipantContests = () => {
  const { id: tournamentId } = useParams<{ id: string }>();

  const [contests, setContests] = useState<ContestWithParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError("");

    try {
      const res = await contestApi.getMyContests(tournamentId);
      const list = res.contests || [];

      const enriched = await Promise.all(
        list.map(async (c) => {
          try {
            const [participation, submissionRes] = await Promise.all([
              contestApi.getMyParticipation(c._id).catch(() => null),
              contestApi.getMyVideoSubmission(c._id).catch(() => ({ submission: null })),
            ]);

            return {
              ...c,
              _participation: {
                registrationStatus: participation?.registrationStatus ?? "NONE",
                confirmedJoined: participation?.confirmedJoined ?? false,
                canSubmitVideo: participation?.canSubmitVideo ?? false,
                submission: submissionRes.submission ?? null,
              },
            } as ContestWithParticipation;
          } catch {
            return {
              ...c,
              _participation: {
                registrationStatus: "NONE",
                confirmedJoined: false,
                canSubmitVideo: false,
                submission: null,
              },
            } as ContestWithParticipation;
          }
        }),
      );

      setContests(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState variant="spinner" size="lg" label="Loading your contests..." />;
  }
  if (error) return <ErrorState error={error} />;

  if (contests.length === 0) {
    return (
      <div className="contests-empty">
        <div className="contests-empty-icon" aria-hidden="true">
          <Swords size={40} />
        </div>
        <h3>No contests yet</h3>
        <p>Contests for your group will appear here once the admin publishes them.</p>
      </div>
    );
  }

  return (
    <div className="participant-contests">
      <div className="contests-header">
        <div className="contests-header-icon">
          <Swords size={22} />
        </div>
        <div>
          <h2>Your Contests</h2>
          <p>
            {contests.length} contest{contests.length !== 1 ? "s" : ""} · join on Codeforces, then
            submit your video
          </p>
        </div>
      </div>

      <div className="contests-list">
        {contests.map((c) => (
          <ContestCard key={c._id} contest={c} onUpdate={load} />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Contest card
// ============================================================

interface ContestCardProps {
  contest: ContestWithParticipation;
  onUpdate: () => void;
}

const ContestCard: React.FC<ContestCardProps> = ({ contest, onUpdate }) => {
  const p = contest._participation;
  const isConfirmed = p.confirmedJoined;
  const submission = p.submission;

  const [videoUrl, setVideoUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [formError, setFormError] = useState("");

  const startTime = contest.startTime ? new Date(contest.startTime) : null;
  const durationMinutes =
    contest.durationMinutes ?? Math.floor((contest.durationSeconds || 0) / 60);

  const contestName = contest.name || contest.codeforcesContestName || "Unnamed Contest";

  const handleConfirm = async () => {
    setConfirming(true);
    setFormError("");
    try {
      await contestApi.confirmJoined(contest._id);
      onUpdate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to confirm join");
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!videoUrl.trim()) {
      setFormError("Video URL is required");
      return;
    }
    try {
      const parsed = new URL(videoUrl);
      if (!/^https?:$/.test(parsed.protocol)) {
        setFormError("Video URL must start with http:// or https://");
        return;
      }
    } catch {
      setFormError("Video URL must be a valid URL");
      return;
    }

    setSubmitting(true);
    try {
      await contestApi.submitVideo(contest._id, videoUrl.trim(), note.trim() || undefined);
      setVideoUrl("");
      setNote("");
      onUpdate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit video");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className={`contest-card${isConfirmed ? " contest-card--confirmed" : ""}`}>
      <header className="contest-card-header">
        <div className="contest-card-title">
          <h3>{contestName}</h3>
          <div className="contest-card-meta">
            {contest.stage && (
              <span className="contest-badge contest-badge--stage">
                {contest.stage.replace(/_/g, " ")}
              </span>
            )}
            {contest.group && (
              <span className="contest-badge contest-badge--group">
                <Users size={10} />
                Group {contest.group}
              </span>
            )}
            {contest.status && (
              <span
                className={`contest-badge contest-badge--status status-${contest.status.toLowerCase()}`}
              >
                {contest.status}
              </span>
            )}
          </div>
        </div>

        {submission && (
          <span
            className={`submission-status submission-status--${submission.status.toLowerCase()}`}
          >
            {submission.status === "APPROVED" ? (
              <>
                <CheckCircle size={12} /> Approved
              </>
            ) : submission.status === "REJECTED" ? (
              <>
                <AlertCircle size={12} /> Rejected
              </>
            ) : (
              <>
                <Clock size={12} /> Pending review
              </>
            )}
          </span>
        )}
      </header>

      <div className="contest-card-meta-row">
        {startTime && (
          <span className="contest-meta-item">
            <Calendar size={13} />
            {startTime.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {durationMinutes > 0 && (
          <span className="contest-meta-item">
            <Clock size={13} />
            {durationMinutes} min
          </span>
        )}
      </div>

      {contest.description && <p className="contest-description">{contest.description}</p>}

      {/* Step 1: Join on Codeforces */}
      <div className="contest-step">
        <div className="step-indicator">
          <span className={`step-number${isConfirmed ? " step-number--done" : ""}`}>
            {isConfirmed ? <CheckCircle size={14} /> : "1"}
          </span>
          <span className="step-label">
            {isConfirmed ? "Confirmed on Codeforces" : "Join the contest"}
          </span>
        </div>

        <a
          href={contest.invitationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="invitation-link"
        >
          <ExternalLink size={14} />
          <span className="invitation-link-text">{contest.invitationUrl}</span>
        </a>

        {!isConfirmed && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="btn-confirm-join"
          >
            {confirming ? (
              <>
                <RefreshCw size={14} className="spin" />
                Confirming…
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                I've joined on Codeforces
              </>
            )}
          </button>
        )}
      </div>

      {/* Step 2: Video submission */}
      {isConfirmed && (
        <div className="contest-step">
          <div className="step-indicator">
            <span className={`step-number${submission ? " step-number--done" : ""}`}>
              {submission ? <CheckCircle size={14} /> : "2"}
            </span>
            <span className="step-label">
              {submission ? "Video submitted" : "Submit your video"}
            </span>
          </div>

          {submission ? (
            <SubmissionStatus submission={submission} />
          ) : (
            <form onSubmit={handleSubmit} className="video-form">
              <div className="video-form-field">
                <label>
                  <Video size={12} />
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or streamable.com/..."
                  required
                />
              </div>

              <div className="video-form-field">
                <label>Note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Any context for the reviewer..."
                />
              </div>

              {formError && (
                <div className="video-form-error">
                  <AlertCircle size={12} />
                  {formError}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-submit-video">
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Submit Video
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
};

// ---- Submission status block ------------------------------------------

const SubmissionStatus: React.FC<{ submission: VideoSubmission }> = ({ submission }) => {
  const statusClass = submission.status.toLowerCase();

  return (
    <div className={`submission-block submission-block--${statusClass}`}>
      <div className="submission-block-header">
        {submission.status === "APPROVED" && (
          <>
            <CheckCircle size={16} />
            <span>Approved</span>
          </>
        )}
        {submission.status === "REJECTED" && (
          <>
            <AlertCircle size={16} />
            <span>Rejected</span>
          </>
        )}
        {submission.status === "PENDING" && (
          <>
            <Clock size={16} />
            <span>Under review</span>
          </>
        )}
      </div>

      <a
        href={submission.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="submission-video-link"
      >
        <ExternalLink size={12} />
        {submission.videoUrl}
      </a>

      {submission.status === "REJECTED" && submission.rejectionReason && (
        <div className="submission-rejection">
          <strong>Reason:</strong> {submission.rejectionReason}
        </div>
      )}

      {submission.note && (
        <div className="submission-note">
          <strong>Your note:</strong> {submission.note}
        </div>
      )}
    </div>
  );
};

export default ParticipantContests;
        