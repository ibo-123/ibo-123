import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminContestResults } from "../AdminContestResults";

vi.mock("../../../services/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from "../../../services/api";

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);

const mockRoster = [
  {
    participantId: "p1",
    user: { name: "Alice", username: "alice" },
    group: "A",
    seed: 1,
    videoStatus: "APPROVED",
    isEligible: true,
    solved: 0,
    penalty: 0,
    rank: null,
    effectiveSolved: 0,
    effectivePenalty: 0,
  },
  {
    participantId: "p2",
    user: { name: "Bob", username: "bob" },
    group: "A",
    seed: 2,
    videoStatus: "NOT_SUBMITTED",
    isEligible: false,
    solved: 0,
    penalty: 0,
    rank: null,
    effectiveSolved: 0,
    effectivePenalty: 0,
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/contests/c1/results"]}>
      <Routes>
        <Route path="/admin/contests/:contestId/results" element={<AdminContestResults />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockedGet.mockReset();
  mockedPost.mockReset();
});

describe("AdminContestResults", () => {
  it("renders roster with eligible + ineligible states", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        contest: {
          _id: "c1",
          name: "Test Contest",
          stage: "GROUP_STAGE",
          group: "A",
          status: "FINISHED",
        },
        matchInfo: null,
        roster: mockRoster,
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/Eligible \(video approved\)/i)).toBeInTheDocument();
  });

  it("disables inputs for participants without an approved video", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        contest: {
          _id: "c1",
          name: "Test Contest",
          stage: "GROUP_STAGE",
          group: "A",
          status: "FINISHED",
        },
        matchInfo: null,
        roster: mockRoster,
      },
    });

    renderPage();
    await waitFor(() => screen.getByText("Bob"));

    // Alice's solved input should be enabled
    const aliceRow = screen.getByText("Alice").closest("tr");
    const aliceSolved = aliceRow!.querySelector("input[type=number]") as HTMLInputElement;
    expect(aliceSolved).not.toBeDisabled();

    // Bob's solved input should be disabled
    const bobRow = screen.getByText("Bob").closest("tr");
    const bobSolved = bobRow!.querySelector("input[type=number]") as HTMLInputElement;
    expect(bobSolved).toBeDisabled();
  });

  it("shows Match Winner banner when matchInfo has winner", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        contest: {
          _id: "c1",
          name: "Test Contest",
          stage: "QUARTER_FINAL",
          matchNumber: 1,
          status: "FINISHED",
        },
        matchInfo: {
          matchId: "m1",
          matchNumber: 1,
          stage: "QUARTER_FINAL",
          status: "COMPLETED",
          isLocked: false,
          winner: { participantId: "p1", name: "Alice", username: "alice" },
        },
        roster: mockRoster,
      },
    });

    renderPage();

    // Wait for the winner banner to render
    const banner = await screen.findByTestId("match-winner-banner");

    // Assert the winner name is inside that banner specifically
    expect(within(banner).getByText("Alice")).toBeInTheDocument();
    expect(within(banner).getByText(/Match Winner/i)).toBeInTheDocument();
  });

  it("shows Match Tied banner with rematch button when status is TIE", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        contest: {
          _id: "c1",
          name: "Test Contest",
          stage: "QUARTER_FINAL",
          matchNumber: 1,
          status: "FINISHED",
        },
        matchInfo: {
          matchId: "m1",
          matchNumber: 1,
          stage: "QUARTER_FINAL",
          status: "TIE",
          isLocked: false,
          winner: null,
        },
        roster: mockRoster,
      },
    });

    renderPage();

    const banner = await screen.findByTestId("match-tied-banner");
    expect(within(banner).getByText(/Match Tied/i)).toBeInTheDocument();
    expect(within(banner).getByText(/Start Rematch/i)).toBeInTheDocument();
  });
});
