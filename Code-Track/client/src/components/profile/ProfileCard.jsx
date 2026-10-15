import { User, Mail, Code2, Trophy } from "lucide-react";
// // this file should be updated

function ProfileCard({ user, codeforces }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">

      <div className="flex flex-col items-center">

        <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        <h2 className="text-2xl font-bold mt-4">
          {user?.name}
        </h2>

        <p className="text-slate-500">
          Competitive Programmer
        </p>

      </div>

      <div className="mt-8 space-y-5">

        <div className="flex items-center gap-3">
          <User size={20} />
          <span>{user?.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <Mail size={20} />
          <span>{user?.email}</span>
        </div>

        <div className="flex items-center gap-3">
          <Code2 size={20} />
          <span>{user?.codeforcesHandle || "Not Connected"}</span>
        </div>

        <div className="flex items-center gap-3">
          <Trophy size={20} />
          <span>{user?.leetcodeUsername || "Not Connected"}</span>
        </div>

      </div>

      {codeforces && (
        <div className="mt-8 border-t pt-6">

          <h3 className="font-bold mb-4">
            Codeforces Statistics
          </h3>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <p className="text-sm text-slate-500">Rating</p>
              <p className="font-bold">{codeforces.rating}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Max Rating</p>
              <p className="font-bold">{codeforces.maxRating}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Rank</p>
              <p>{codeforces.rank}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Contribution</p>
              <p>{codeforces.contribution}</p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default ProfileCard;