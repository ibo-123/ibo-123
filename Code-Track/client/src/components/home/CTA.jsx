// components/home/CTA.jsx
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Rocket, 
  Sparkles,
  Code2,
  Users,
  Trophy
} from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";

function CTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Join 10,000+ Coders</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Level Up Your Coding Skills?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of competitive programmers tracking their progress with CodeTrack.
            Start your journey to becoming a better coder today.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Code2 className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">1.2M+</p>
              <p className="text-xs text-white/70">Problems Solved</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Users className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-xs text-white/70">Active Coders</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Trophy className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">850+</p>
              <p className="text-xs text-white/70">Contests</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="h-12 px-8 bg-white text-foreground hover:bg-white/90 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate("/register")}
                  className="h-12 px-8 bg-white text-foreground hover:bg-white/90 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  Get Started Free
                  <Rocket className="w-5 h-5 ml-2 group-hover:translate-y-[-2px] transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="h-12 px-8 border-white/30 text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-200"
                >
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </>
            )}
          </div>

          <p className="text-white/60 text-sm mt-6">
            🚀 No credit card required. Start tracking in 2 minutes.
          </p>
        </div>
      </div>
    </section>
  );
}

export default CTA;