// components/home/FAQ.jsx
import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  Sparkles
} from "lucide-react";

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is CodeTrack?",
      answer: "CodeTrack is a comprehensive platform designed for competitive programmers to track their progress, analyze performance, and improve their coding skills. It integrates with popular platforms like Codeforces and LeetCode."
    },
    {
      question: "Is CodeTrack free to use?",
      answer: "Yes, CodeTrack offers a free tier with all essential features. We also offer premium plans with advanced analytics, custom goals, and priority support for serious competitive programmers."
    },
    {
      question: "How do I connect my Codeforces account?",
      answer: "Simply navigate to your profile settings, enter your Codeforces handle, and click 'Connect'. We'll automatically sync your problem-solving data and contest history."
    },
    {
      question: "Can I track multiple platforms?",
      answer: "Absolutely! CodeTrack supports integration with Codeforces, LeetCode, and more platforms are coming soon. You can track your progress across all your favorite coding platforms in one place."
    },
    {
      question: "How accurate is the rating prediction?",
      answer: "Our rating prediction system uses advanced machine learning algorithms trained on thousands of contests. While not 100% accurate, it provides a reliable estimate of your potential rating."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take security seriously. All data is encrypted in transit and at rest. We never share your personal information with third parties without your explicit consent."
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-100 rounded-full mb-4">
            <HelpCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-500 mt-4">
            Find answers to common questions about CodeTrack
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-100 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-200"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-4 pt-2">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;