import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../services/adminApi";
import { tournamentApi } from "../../services/tournamentApi";
import type { PlayoffFormat } from "../../types/tournament";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Users,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

const formatDateInput = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const EditTournament: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    registrationStart: "",
    registrationEnd: "",
    tournamentStart: "",
    tournamentEnd: "",
    maxParticipants: 20,
    numberOfGroups: 4,
    qualifiersPerGroup: 2,
    playoffFormat: "SINGLE_ELIMINATION" as PlayoffFormat,
    participantsPerGroup: 5,
  });

  useEffect(() => {
    const loadTournament = async () => {
      if (!id) return;
      try {
        const { tournament } = await tournamentApi.get(id);
        setFormData({
          name: tournament.name || "",
          description: tournament.description || "",
          registrationStart: formatDateInput(tournament.registrationStart),
          registrationEnd: formatDateInput(tournament.registrationEnd),
          tournamentStart: formatDateInput(tournament.tournamentStart),
          tournamentEnd: formatDateInput(tournament.tournamentEnd),
          maxParticipants: tournament.maxParticipants || 20,
          numberOfGroups: tournament.numberOfGroups || 4,
          qualifiersPerGroup: tournament.qualifiersPerGroup || 2,
          playoffFormat: (tournament.playoffFormat || "SINGLE_ELIMINATION") as PlayoffFormat,
          participantsPerGroup:
            tournament.participantsPerGroup ||
            tournament.maxParticipants / (tournament.numberOfGroups || 4),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tournament.");
      } finally {
        setLoadingTournament(false);
      }
    };

    loadTournament();
  }, [id]);

  useEffect(() => {
    const max = Number(formData.maxParticipants);
    const groups = Number(formData.numberOfGroups);

    if (max > 0 && groups > 0 && max % groups === 0) {
      setFormData((prev) => ({
        ...prev,
        participantsPerGroup: max / groups,
      }));
    }
  }, [formData.maxParticipants, formData.numberOfGroups]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const regStart = new Date(formData.registrationStart);
      const regEnd = new Date(formData.registrationEnd);
      const tournStart = new Date(formData.tournamentStart);
      const tournEnd = new Date(formData.tournamentEnd);

      if (regStart >= regEnd) {
        setError("Registration end must be after registration start");
        setIsLoading(false);
        return;
      }

      if (regEnd > tournStart) {
        setError("Tournament start must be after registration end");
        setIsLoading(false);
        return;
      }

      if (tournStart >= tournEnd) {
        setError("Tournament end must be after tournament start");
        setIsLoading(false);
        return;
      }

      if (formData.maxParticipants % formData.numberOfGroups !== 0) {
        setError("Maximum participants must be divisible by number of groups");
        setIsLoading(false);
        return;
      }

      const participantsPerGroup = formData.maxParticipants / formData.numberOfGroups;
      if (formData.qualifiersPerGroup >= participantsPerGroup) {
        setError("Qualifiers per group must be less than participants per group");
        setIsLoading(false);
        return;
      }

      await adminApi.updateTournament(id, {
        ...formData,
        participantsPerGroup,
      });

      setSuccess(true);
      setTimeout(() => navigate("/admin"), 1000);
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { errors?: { field: string; message: string }[]; message?: string } };
      };
      if (axiosErr.response?.data?.errors) {
        setError(
          axiosErr.response.data.errors.map((item) => `${item.field}: ${item.message}`).join(", "),
        );
      } else if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else {
        setError("Failed to update tournament. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "white",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "8px",
  };

  const sectionStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  };

  if (loadingTournament) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "white" }}>
        <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ marginTop: 12 }}>Loading tournament…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <small
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "2px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} color="#FFD700" />
            Edit Tournament
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
              background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Update Tournament
          </h1>
        </div>

        <button
          onClick={() => navigate("/admin")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft size={16} />
          Back to Admin
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.2)",
            color: "#FF6B6B",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
            color: "#22C55E",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} />
          Tournament updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Trophy size={18} color="#FFD700" />
            Tournament Details
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Tournament Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Calendar size={18} color="#64B5F6" />
            Schedule & Capacity
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Registration Start</label>
              <input
                type="datetime-local"
                name="registrationStart"
                value={formData.registrationStart}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Registration End</label>
              <input
                type="datetime-local"
                name="registrationEnd"
                value={formData.registrationEnd}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Tournament Start</label>
              <input
                type="datetime-local"
                name="tournamentStart"
                value={formData.tournamentStart}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Tournament End</label>
              <input
                type="datetime-local"
                name="tournamentEnd"
                value={formData.tournamentEnd}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Max Participants</label>
              <input
                type="number"
                min={1}
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Number of Groups</label>
              <input
                type="number"
                min={1}
                name="numberOfGroups"
                value={formData.numberOfGroups}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Participants / Group</label>
              <input
                type="number"
                min={1}
                name="participantsPerGroup"
                value={formData.participantsPerGroup}
                onChange={handleChange}
                style={inputStyle}
                readOnly
              />
            </div>
            <div>
              <label style={labelStyle}>Qualifiers / Group</label>
              <input
                type="number"
                min={1}
                name="qualifiersPerGroup"
                value={formData.qualifiersPerGroup}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Playoff Format</label>
              <select
                name="playoffFormat"
                value={formData.playoffFormat}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="SINGLE_ELIMINATION">Single Elimination</option>
              </select>
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}
        >
          <button
            type="button"
            onClick={() => navigate("/admin")}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2979FF, #1565C0)",
              border: "none",
              color: "white",
              fontWeight: "700",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isLoading ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Users size={16} />
            )}
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTournament;
