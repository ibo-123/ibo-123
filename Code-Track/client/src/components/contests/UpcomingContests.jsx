import { Card, CardContent } from "../ui/card";
import { CalendarDays } from "lucide-react";

function UpcomingContests({ contests = [] }) {
  return (
    <Card>
      <CardContent className="p-6">

        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="text-blue-600" />

          <h2 className="text-xl font-bold">
            Upcoming Contests
          </h2>
        </div>

        {contests.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No upcoming contests found.
          </div>
        ) : (
          <div className="space-y-4">

            {contests.map((contest) => (
              <div
                key={contest.id}
                className="border rounded-lg p-4 hover:bg-slate-50 transition"
              >
                <h3 className="font-semibold text-lg">
                  {contest.name}
                </h3>

                <p className="text-slate-500 text-sm mt-1">
                  {new Date(
                    contest.startTimeSeconds * 1000
                  ).toLocaleString()}
                </p>

                <p className="text-sm mt-2">
                  Duration:{" "}
                  {Math.floor(contest.durationSeconds / 3600)}h{" "}
                  {Math.floor(
                    (contest.durationSeconds % 3600) / 60
                  )}m
                </p>

              </div>
            ))}

          </div>
        )}

      </CardContent>
    </Card>
  );
}

export default UpcomingContests;        