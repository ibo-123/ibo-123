// components/home/DashboardPreview.jsx
import { 
  Monitor, 
  Code2, 
  Trophy, 
  TrendingUp,
  ArrowRight,
  Sparkles,
  Activity,
  Calendar,
  Award,
  Star
} from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

function DashboardPreview() {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-4">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Live Demo</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              See Your Progress in Real-Time
            </h2>
            <p className="text-lg text-slate-500 mb-6">
              Our intuitive dashboard visualizes your coding journey, making it easy to track
              performance, identify areas for improvement, and celebrate achievements.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                { icon: Activity, label: "Live problem-solving analytics" },
                { icon: Calendar, label: "Weekly performance tracking" },
                { icon: Award, label: "Achievement badges and milestones" },
                { icon: Star, label: "Custom progress goals" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <item.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              Explore Dashboard
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Dashboard • CodeTrack</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400">Live</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* Chart Placeholder */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Performance Overview</span>
                    <span className="text-xs text-slate-400">Last 7 days</span>
                  </div>
                  <div className="flex items-end justify-between h-24 gap-1">
                    {[40, 65, 45, 80, 70, 90, 85].map((height, index) => (
                      <div key={index} className="flex-1">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            index === 5 || index === 6 ? 'bg-gradient-to-t from-blue-500 to-purple-500' : 'bg-slate-200'
                          }`}
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Solved", value: "247", change: "+12", color: "blue" },
                    { label: "Rating", value: "1650", change: "+50", color: "purple" },
                    { label: "Rank", value: "#42", change: "↑5", color: "green" },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                      <p className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className={`text-xs font-medium text-${stat.color}-600`}>{stat.change}</p>
                    </div>
                  ))}
                </div>

                {/* Activity Bar */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs text-slate-600">Currently solving: "Dynamic Programming"</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-slate-400">Streak: 12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-4 -right-4 animate-float">
              <div className="p-3 bg-green-500 rounded-2xl shadow-lg">
                <span className="text-white text-sm font-bold">+12</span>
                <span className="block text-[10px] text-green-100">This week</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 animate-float delay-100">
              <div className="p-3 bg-purple-500 rounded-2xl shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="block text-[10px] text-purple-100">Improving</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;