import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { Tournament } from "../types";
import { tournamentApi } from "../services/tournamentApi";

interface AdminContextType {
  selectedTournament: Tournament | null;
  setSelectedTournament: (tournament: Tournament | null) => void;
  tournaments: Tournament[];
  loading: boolean;
  refreshTournaments: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

const SELECTED_KEY = "admin-selected-tournament";

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Stable loader ---------------------------------------------------
  // useCallback with an empty dep array = same function reference for the
  // lifetime of the provider. This is what prevents the re-render loop.
  const loadTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const { tournaments: allTournaments } = await tournamentApi.list();
      setTournaments(allTournaments);

      if (allTournaments.length > 0) {
        const savedId = localStorage.getItem(SELECTED_KEY);
        const found = savedId ? allTournaments.find((t) => t._id === savedId) : null;
        setSelectedTournament(found || allTournaments[0]);
      } else {
        setSelectedTournament(null);
      }
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Initial load (once) ---------------------------------------------
  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  // ---- Persist selection -----------------------------------------------
  const selectedId = selectedTournament?._id;
  useEffect(() => {
    if (selectedId) {
      localStorage.setItem(SELECTED_KEY, selectedId);
    }
  }, [selectedId]);

  // ---- Memoized context value ------------------------------------------
  // Prevents consumers from re-rendering when nothing actually changed.
  const value = useMemo<AdminContextType>(
    () => ({
      selectedTournament,
      setSelectedTournament,
      tournaments,
      loading,
      refreshTournaments: loadTournaments,
    }),
    [selectedTournament, tournaments, loading, loadTournaments],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
