import { Card, CardContent } from "../ui/card";
import { Trophy } from "lucide-react";

function ContestHistory({ history = [] }) {
  return (
    <Card>
      <CardContent className="p-6">

        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-yellow-500" />

          <h2 className="text-xl font-bold">
            Contest History
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No contest history available.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="border-b">

                  <th className="text-left py-3">
                    Contest
                  </th>

                  <th className="text-left py-3">
                    Rank
                  </th>

                  <th className="text-left py-3">
                    Rating Change
                  </th>

                  <th className="text-left py-3">
                    New Rating
                  </th>

                </tr>
              </thead>

              <tbody>

                {history.map((item) => {
                  const change =
                    item.newRating - item.oldRating;

                  return (
                    <tr
                      key={item.contestId}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="py-3">
                        {item.contestName}
                      </td>

                      <td>
                        {item.rank}
                      </td>

                      <td
                        className={
                          change >= 0
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {change >= 0 ? "+" : ""}
                        {change}
                      </td>

                      <td>
                        {item.newRating}
                      </td>
                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </CardContent>
    </Card>
  );
}

export default ContestHistory;