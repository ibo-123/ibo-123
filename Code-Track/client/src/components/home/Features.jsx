// components/home/Features.jsx
import { 
  BarChart3, 
  Trophy, 
  Users, 
  Zap, 
  Target, 
  BookOpen,
  Sparkles
} from "lucide-react";

function Features() {
  const features = [
    {
      icon: BarChart3,
      title: "Track Your Progress",
      description: "Monitor your problem-solving journey with detailed analytics and performance metrics.",
      color: "primary"
    },
    {
      icon: Trophy,
      title: "Compete & Win",
      description: "Join coding contests, climb the leaderboard, and earn recognition for your skills.",
      color: "orange"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with fellow programmers, share solutions, and learn collaboratively.",
      color: "green"
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Get instant feedback and notifications as you solve problems and improve.",
      color: "purple"
    },
    {
      icon: Target,
      title: "Smart Recommendations",
      description: "AI-powered problem suggestions tailored to your skill level and goals.",
      color: "red"
    },
    {
      icon: BookOpen,
      title: "Learning Resources",
      description: "Access tutorials, editorials, and curated content to accelerate your learning.",
      color: "indigo"
    },
  ];

  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Built for competitive programmers, CodeTrack provides all the tools you need
            to track, analyze, and improve your coding skills.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-card rounded-2xl border hover:border-primary/20 hover:shadow-xl transition-all duration-300"
              >
                <div className={`p-3 bg-${feature.color}/10 rounded-xl w-fit group-hover:scale-110 transition-transform mb-4`}>
                  <Icon className={`w-6 h-6 text-${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className={`mt-4 w-8 h-0.5 bg-${feature.color} group-hover:w-12 transition-all`}></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;