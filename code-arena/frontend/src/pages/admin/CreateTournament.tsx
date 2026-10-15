import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/adminApi";
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
  Clock,
  Settings,
  Shield,
  Zap,
  Target,
} from "lucide-react";

const CreateTournament: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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
    groupContests: 1,
    playoffFormat: "SINGLE_ELIMINATION" as PlayoffFormat,
    participantsPerGroup: 5,
  });

  const [calculatedParticipantsPerGroup, setCalculatedParticipantsPerGroup] = useState<
    number | null
  >(5);

  useEffect(() => {
    const max = Number(formData.maxParticipants);
    const groups = Number(formData.numberOfGroups);

    const updateCalculation = () => {
      if (max > 0 && groups > 0 && max % groups === 0) {
        const calculated = max / groups;
        setCalculatedParticipantsPerGroup(calculated);
        setFormData((prev) => ({
          ...prev,
          participantsPerGroup: calculated,
        }));
      } else {
        setCalculatedParticipantsPerGroup(null);
      }
    };
    updateCalculation();
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

      const payload = {
        ...formData,
        participantsPerGroup: participantsPerGroup,
      };

      await adminApi.createTournament(payload);
      setSuccess(true);

      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (err) {
      const axiosErr = err as {
        response?: {
          data?: {
            errors?: { field: string; message: string }[];
            message?: string;
          };
        };
      };
      if (axiosErr.response?.data?.errors) {
        const errorMessages = axiosErr.response.data.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ");
        setError(errorMessages);
      } else if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else {
        setError("Failed to create tournament. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 0", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "36px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={14} color="var(--gold)" />
              New Tournament
            </span>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: "20px",
                background: "var(--gradient-brand)",
                fontSize: "9px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "white",
              }}
            >
              Beta
            </span>
          </div>
          <h1
            className="gradient-text"
            style={{
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: "800",
              margin: "0",
              letterSpacing: "-0.5px",
            }}
          >
            Create Tournament
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              margin: "4px 0 0 0",
            }}
          >
            Set up a new competition and configure its structure
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/tournaments")}
          style={{
            padding: "12px 24px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-secondary)",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.3s ease",
            fontWeight: "500",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="glass-card"
          style={{
            padding: "18px 24px",
            color: "var(--red)",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            borderColor: "rgba(239,68,68,0.2)",
          }}
        >
          <AlertCircle size={22} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="glass-card"
          style={{
            padding: "18px 24px",
            color: "var(--green)",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            borderColor: "rgba(34,197,94,0.2)",
          }}
        >
          <CheckCircle size={22} />
          <span>
            Tournament created successfully! <span style={{ opacity: 0.7 }}>Redirecting...</span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div className="glass-card" style={{ padding: "28px 30px", marginBottom: "24px" }}>
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "16px",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "22px",
              paddingBottom: "14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "6px",
                borderRadius: "10px",
                background: "rgba(255,215,0,0.1)",
              }}
            >
              <Trophy size={18} color="var(--gold)" />
            </div>
            Basic Information
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "22px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Tournament Name <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="e.g., Code Arena 2026 Championship"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Describe your tournament, rules, and other important details..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Registration Schedule */}
        <div className="glass-card" style={{ padding: "28px 30px", marginBottom: "24px" }}>
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "16px",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "22px",
              paddingBottom: "14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "6px",
                borderRadius: "10px",
                background: "rgba(41,121,255,0.1)",
              }}
            >
              <Calendar size={18} color="var(--blue)" />
            </div>
            Registration Schedule
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "22px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Registration Start <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="registrationStart"
                value={formData.registrationStart}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  colorScheme: "dark",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Registration End <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="registrationEnd"
                value={formData.registrationEnd}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  colorScheme: "dark",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tournament Schedule */}
        <div className="glass-card" style={{ padding: "28px 30px", marginBottom: "24px" }}>
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "16px",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "22px",
              paddingBottom: "14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "6px",
                borderRadius: "10px",
                background: "rgba(56,189,248,0.1)",
              }}
            >
              <Clock size={18} color="var(--purple)" />
            </div>
            Tournament Schedule
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "22px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Tournament Start <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="tournamentStart"
                value={formData.tournamentStart}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  colorScheme: "dark",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Tournament End <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="tournamentEnd"
                value={formData.tournamentEnd}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  colorScheme: "dark",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Tournament Structure */}
        <div className="glass-card" style={{ padding: "28px 30px", marginBottom: "24px" }}>
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "16px",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "22px",
              paddingBottom: "14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "6px",
                borderRadius: "10px",
                background: "rgba(76,175,80,0.1)",
              }}
            >
              <Settings size={18} color="var(--green)" />
            </div>
            Tournament Structure
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "22px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Max Participants <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  required
                  min="1"
                  style={{
                    width: "100%",
                    padding: "14px 18px 14px 42px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--blue)";
                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <Users
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Number of Groups <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  name="numberOfGroups"
                  value={formData.numberOfGroups}
                  onChange={handleChange}
                  required
                  min="1"
                  style={{
                    width: "100%",
                    padding: "14px 18px 14px 42px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--blue)";
                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <Target
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Participants Per Group
              </label>
              <div
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color:
                    calculatedParticipantsPerGroup !== null
                      ? "var(--green)"
                      : "rgba(255,255,255,0.2)",
                  fontSize: "20px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "50px",
                  position: "relative",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                {calculatedParticipantsPerGroup !== null
                  ? calculatedParticipantsPerGroup
                  : "Invalid"}
                {calculatedParticipantsPerGroup !== null && (
                  <span
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontWeight: "400",
                    }}
                  >
                    auto
                  </span>
                )}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Qualifiers Per Group <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  name="qualifiersPerGroup"
                  value={formData.qualifiersPerGroup}
                  onChange={handleChange}
                  required
                  min="1"
                  style={{
                    width: "100%",
                    padding: "14px 18px 14px 42px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--blue)";
                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <Shield
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Group Contests <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  name="groupContests"
                  value={formData.groupContests}
                  onChange={handleChange}
                  required
                  min="1"
                  style={{
                    width: "100%",
                    padding: "14px 18px 14px 42px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--blue)";
                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <Zap
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                Playoff Format <span style={{ color: "var(--blue)" }}>*</span>
              </label>
              <select
                name="playoffFormat"
                value={formData.playoffFormat}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px 40px 14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.3)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="SINGLE_ELIMINATION" style={{ background: "var(--bg-secondary)" }}>
                  Single Elimination
                </option>
              </select>
            </div>
          </div>

          {/* Summary Card */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px 20px",
              borderRadius: "14px",
              background: "rgba(41,121,255,0.06)",
              border: "1px solid rgba(41,121,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Sparkles size={16} color="var(--gold)" style={{ opacity: 0.6 }} />
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontWeight: "500",
              }}
            >
              Tournament will host{" "}
              <strong style={{ color: "var(--text-primary)" }}>{formData.maxParticipants}</strong>{" "}
              participants across{" "}
              <strong style={{ color: "var(--text-primary)" }}>{formData.numberOfGroups}</strong>{" "}
              groups with{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {formData.qualifiersPerGroup}
              </strong>{" "}
              qualifiers each
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "36px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/admin/tournaments")}
            disabled={isLoading}
            style={{
              padding: "14px 28px",
              borderRadius: "14px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
              fontSize: "14px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading || success}
            className="glow-blue"
            style={{
              padding: "14px 36px",
              borderRadius: "14px",
              background: isLoading || success ? "rgba(255,255,255,0.05)" : "var(--gradient-brand)",
              border: "none",
              color: "white",
              fontWeight: "700",
              fontSize: "14px",
              cursor: isLoading || success ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transition: "all 0.3s ease",
              opacity: isLoading || success ? 0.5 : 1,
              boxShadow: !isLoading && !success ? "var(--shadow-glow)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !success) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 28px rgba(41,121,255,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && !success) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-glow)";
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : success ? (
              <>
                <CheckCircle size={18} />
                Created!
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Create Tournament
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        input:focus, textarea:focus, select:focus {
          border-color: var(--blue) !important;
          box-shadow: 0 0 0 4px rgba(41,121,255,0.12) !important;
        }
        input:hover, textarea:hover, select:hover {
          border-color: rgba(255,255,255,0.15);
        }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export default CreateTournament;
