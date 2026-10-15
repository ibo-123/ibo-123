// components/home/Stats.jsx
import { 
  Users, 
  Code2, 
  Trophy, 
  Award
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    { 
      icon: Code2, 
      label: "Problems Solved", 
      value: "1.2M+", 
      change: "+12%",
      color: "primary"
    },
    { 
      icon: Users, 
      label: "Active Users", 
      value: "10K+", 
      change: "+23%",
      color: "green"
    },
    { 
      icon: Trophy, 
      label: "Contests Hosted", 
      value: "850+", 
      change: "+8%",
      color: "purple"
    },
    { 
      icon: Award, 
      label: "Top Rank Achieved", 
      value: "#1", 
      change: "🔥",
      color: "orange"
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`transform transition-all duration-700 ${
                  isVisible 
                    ? "translate-y-0 opacity-100" 
                    : "translate-y-12 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl border hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 bg-${stat.color}/10 rounded-xl group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 bg-${stat.color}/10 text-${stat.color} rounded-full`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Stats;