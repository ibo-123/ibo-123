// components/home/Testimonials.jsx
import { useState } from "react";
import { 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  User
} from "lucide-react";

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Senior Developer at Google",
      image: "S",
      content: "CodeTrack completely transformed how I approach competitive programming. The analytics and insights helped me identify my weak areas and improve my rating by 400 points in just 3 months.",
      rating: 5,
      date: "December 2025"
    },
    {
      name: "Michael Chen",
      role: "Competitive Programmer, ICPC Finalist",
      image: "M",
      content: "This is the tool every competitive programmer needs. The integration with Codeforces and LeetCode is seamless, and the progress tracking features are unmatched.",
      rating: 5,
      date: "November 2025"
    },
    {
      name: "Emily Rodriguez",
      role: "Software Engineer at Meta",
      image: "E",
      content: "I've tried many coding trackers, but CodeTrack is by far the best. The community features and contest reminders keep me motivated and consistently improving.",
      rating: 5,
      date: "October 2025"
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const testimonial = testimonials[currentIndex];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Testimonials</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            What Our Users Say
          </h2>
          <p className="text-lg text-slate-500 mt-4">
            Join thousands of programmers who trust CodeTrack
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 md:p-10 relative">
          {/* Quote Icon */}
          <div className="absolute -top-4 -left-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <Quote className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-slate-700 leading-relaxed">
              "{testimonial.content}"
            </p>
          </div>

          {/* Author */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {testimonial.image}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{testimonial.name}</p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{testimonial.date}</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={prevTestimonial}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex gap-1">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? "w-8 bg-gradient-to-r from-blue-600 to-purple-600" 
                      : "bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={nextTestimonial}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { label: "Active Users", value: "10K+" },
            { label: "5-Star Ratings", value: "98%" },
            { label: "Countries", value: "120+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-white rounded-xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;