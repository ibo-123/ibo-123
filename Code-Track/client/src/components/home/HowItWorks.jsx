// components/home/HowItWorks.jsx
import { 
  UserPlus, 
  Code2, 
  BarChart3, 
  Trophy,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: "Create Your Account",
      description: "Sign up with your email and set up your competitive programming profile.",
      color: "primary"
    },
    {
      icon: Code2,
      title: "Connect Platforms",
      description: "Link your Codeforces and LeetCode accounts to sync your progress automatically.",
      color: "purple"
    },
    {
      icon: BarChart3,
      title: "Track & Analyze",
      description: "Get detailed insights into your performance with beautiful analytics and charts.",
      color: "green"
    },
    {
      icon: Trophy,
      title: "Improve & Compete",
      description: "Set goals, participate in contests, and climb the global leaderboard.",
      color: "orange"
    },
  ];

  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-500">Simple Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Get Started in 4 Easy Steps
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Join thousands of competitive programmers who trust CodeTrack to monitor
            their growth and achieve their coding goals.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/30 via-purple-500/30 to-orange-500/30 -translate-y-1/2"></div>
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <div className="p-6 bg-card rounded-2xl border hover:shadow-xl transition-all duration-300 group text-center">
                  {/* Step Number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-foreground to-muted-foreground rounded-full flex items-center justify-center text-background text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`p-4 bg-${step.color}/10 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 text-${step.color}`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Step Indicator */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-0.5 bg-border"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            onClick={() => navigate("/register")}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            Start Your Journey Now
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;