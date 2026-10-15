// app/page.tsx
"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";

// Statistics data
const stats = {
  members: 250,
  lecturers: 15,
  achievements: 42,
};

// Loading Screen Props
interface LoadingScreenProps {
  onFinish: () => void;
}
const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-5xl font-bold text-white">NCC</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "200px" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full mx-auto"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-green-400 font-mono"
        >
          Loading future of programming...
        </motion.p>
      </div>
    </motion.div>
  );
};

// Counter Props
interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}
const Counter: React.FC<CounterProps> = ({
  end,
  duration = 2,
  suffix = "",
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView || hasAnimated) return;

    setHasAnimated(true);
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, end, duration, hasAnimated]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-white">
      {count}
      {suffix}
    </span>
  );
};

// Section Props
interface SectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}
const Section: React.FC<SectionProps> = ({
  children,
  className = "",
  delay = 0,
  id = "",
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

// Floating Elements Component
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-green-500/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Navbar Component
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-gray-900/95 backdrop-blur-lg border-b border-green-900/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NCC</span>
            </div>
            <span className="text-white font-bold">MSJ</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/about"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="/courses"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/events"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              Events
            </Link>
            <Link
              href="/contact"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-600 transition-all"
            >
              Join Now
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

// NCC Logo Component
const NCCLogo = () => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl"
    >
      <span className="text-4xl md:text-5xl font-bold text-white">NCC</span>
    </motion.div>
  );
};

// MAIN PAGE COMPONENT - This was missing!
export default function Home() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <FloatingElements />
      <Navbar />

      {/* Hero Section */}
      <Section className="min-h-screen flex items-center justify-center text-center px-4 pt-20">
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <NCCLogo />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            National Cadet Corps
            <span className="block text-green-400">MSJ</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
          >
            Join the premier cadet corps organization. Develop leadership,
            discipline, and patriotism.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-x-4"
          >
            <Link
              href="/register"
              className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-600 transition-all"
            >
              Join Now
            </Link>
            <Link
              href="/about"
              className="inline-block border border-green-500 text-green-400 px-8 py-3 rounded-lg font-semibold hover:bg-green-500/10 transition-all"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* Stats Section */}
      <Section delay={0.2} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Our Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-8 text-center">
              <Counter end={stats.members} suffix="+" />
              <p className="text-gray-400 mt-2">Active Cadets</p>
            </div>
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-8 text-center">
              <Counter end={stats.lecturers} suffix="+" />
              <p className="text-gray-400 mt-2">Expert Lecturers</p>
            </div>
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-8 text-center">
              <Counter end={stats.achievements} suffix="+" />
              <p className="text-gray-400 mt-2">Achievements</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Features Section */}
      <Section delay={0.4} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Join NCC MSJ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section delay={0.6} className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join NCC MSJ today and become part of something greater.
          </p>
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-600 transition-all"
          >
            Get Started Now
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-green-900/30 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NCC</span>
              </div>
              <span className="text-white font-bold">MSJ</span>
            </div>
            <p className="text-gray-400 text-sm">
              Building future leaders through discipline and service.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-green-400">
                  About
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-green-400">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-green-400">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-green-400">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/blog" className="hover:text-green-400">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-green-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-green-400">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-green-400">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-green-400">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm mt-8 pt-8 border-t border-green-900/30">
          © 2024 NCC MSJ. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

// Features data
const features = [
  {
    icon: "🎯",
    title: "Leadership Development",
    description:
      "Develop essential leadership skills through hands-on training and responsibilities.",
  },
  {
    icon: "🤝",
    title: "Community Service",
    description:
      "Make a difference through various community service and outreach programs.",
  },
  {
    icon: "🏆",
    title: "Adventure Training",
    description:
      "Participate in exciting outdoor activities and adventure camps.",
  },
  {
    icon: "📚",
    title: "Academic Support",
    description:
      "Balance your cadet duties with academic excellence through our support programs.",
  },
  {
    icon: "🌍",
    title: "National Integration",
    description:
      "Be part of a diverse community promoting national unity and integration.",
  },
  {
    icon: "💪",
    title: "Physical Fitness",
    description:
      "Improve your physical fitness through regular training and activities.",
  },
];
