import { useEffect, useState } from "react";
import { getUpcomingContests, getContestHistory } from "../services/contestService";
import UpcomingContests from "../components/contests/UpcomingContests";
import ContestHistory from "../components/contests/ContestHistory";

function Contests() {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [upcomingData, historyData] = await Promise.all([
        getUpcomingContests(),
        getContestHistory(),
      ]);
      setUpcoming(upcomingData);
      setHistory(historyData);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-8">
      <UpcomingContests contests={upcoming} />
      <ContestHistory history={history} />
    </div>
  );
}

export default Contests;