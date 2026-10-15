// components/home/Hero.jsx
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Code2, 
  Rocket, 
  Trophy, 
  Zap,
  Sparkles,
  Users,
  Star,
  ChevronRight
} from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";

function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                🚀 Track your coding journey
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Master Competitive Programming
              <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                One Problem at a Time
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Track your progress, analyze your performance, and connect with fellow coders. 
              CodeTrack helps you become a better competitive programmer.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="h-12 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  Go to Dashboard
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/register")}
                    className="h-12 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                  >
                    Start Tracking Now
                    <Rocket className="w-5 h-5 ml-2 group-hover:translate-y-[-2px] transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="h-12 px-8 font-semibold rounded-xl border-2 hover:bg-accent transition-all duration-200"
                  >
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-foreground">10K+</p>
                  <p className="text-xs text-muted-foreground">Active Coders</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-foreground">50K+</p>
                  <p className="text-xs text-muted-foreground">Problems Solved</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-foreground">99%</p>
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Code2 className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Dashboard Preview</p>
                      <p className="text-xs text-muted-foreground">Live progress tracking</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Problems Solved", value: "247", color: "primary" },
                    { label: "Contest Rating", value: "1650", color: "purple" },
                    { label: "Current Rank", value: "#42", color: "green" },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-3 bg-${stat.color}/10 rounded-xl text-center`}>
                      <p className={`text-lg font-bold text-${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Progress Bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Solving Speed</span>
                      <span>85%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-primary to-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Accuracy</span>
                      <span>72%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[72%] bg-gradient-to-r from-green-500 to-primary rounded-full"></div>
                    </div>
                  </div>
                </div>
                {/* Recent Activity */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">Last solved: "Two Sum"</span>
                  </div>
                  <span className="text-xs text-muted-foreground">5 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Weekly streak: 12 days</span>
                  </div>
                  <span className="text-xs text-muted-foreground">🔥</span>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-4 -right-4 animate-float">
              <div className="p-3 bg-green-500 rounded-2xl shadow-lg">
                <span className="text-white text-sm font-bold">+12</span>
                <span className="block text-[10px] text-green-100">Problems this week</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 animate-float delay-100">
              <div className="p-3 bg-purple-500 rounded-2xl shadow-lg">
                <span className="text-white text-sm font-bold">↑ 150</span>
                <span className="block text-[10px] text-purple-100">Rating points</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;