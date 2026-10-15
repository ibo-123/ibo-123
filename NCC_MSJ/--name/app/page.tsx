"use client";
// homepage - fixed version with only ncc.jpg
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";

// Statistics data (can be fetched from API later)
const stats = {
  members: 250,
  lecturers: 15,
  achievements: 42,
};

// Loading Screen Component
const LoadingScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
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

// Counter Component with Animation
const Counter = ({ end, duration = 2, suffix = "" }) => {
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

// Section Wrapper for Scroll Animations
const Section = ({ children, className = "", delay = 0, id = "" }) => {
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const positions = Array.from({ length: 20 }, (_, i) => ({
    left: `${(i * 13) % 100}%`,
    delay: i * 0.4,
    duration: 15 + (i % 10),
    value: i % 2 === 0 ? "1" : "0",
  }));

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute font-mono text-green-500/10 text-xl will-change-transform"
          initial={{
            x: pos.left,
            y: -20,
            opacity: 0,
          }}
          animate={{
            y: "100vh",
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: pos.duration,
            repeat: Infinity,
            delay: pos.delay,
            ease: "linear",
          }}
        >
          {pos.value}
        </motion.div>
      ))}
    </div>
  );
};

// Navbar Component
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-md border-b border-green-900/30"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NCC</span>
          </div>
          <span className="text-green-400 font-bold hidden sm:block">
            NCC_MSJ
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="#about"
            className="text-gray-300 hover:text-green-400 transition-colors text-sm font-medium"
          >
            About
          </Link>
          <Link
            href="#contact"
            className="text-gray-300 hover:text-green-400 transition-colors text-sm font-medium"
          >
            Contact
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg text-white text-sm font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all"
          >
            Join Us
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-green-400"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-black/90 backdrop-blur-md border-b border-green-900/30 px-6 py-4"
        >
          <div className="flex flex-col space-y-4">
            <Link
              href="#about"
              className="text-gray-300 hover:text-green-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-gray-300 hover:text-green-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg text-white text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Join Us
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
};

// Logo Component - Only uses ncc.jpg
const NCCLogo = () => {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
        <span className="text-4xl font-bold text-white">NCC</span>
      </div>
    );
  }

  return (
    <Image
      src="/ncc.jpg"
      alt="NCC_MSJ Logo - Technology and Programming Community"
      fill
      className="object-contain"
      onError={() => setLogoError(true)}
      priority
    />
  );
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && isMounted && (
          <LoadingScreen onFinish={() => setLoading(false)} />
        )}
      </AnimatePresence>

      <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
        <Navbar />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        {isMounted && <FloatingElements />}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          {/* Hero Section */}
          <Section className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="relative w-32 h-32 mx-auto mb-8"
              >
                <NCCLogo />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-400 rounded-2xl blur-xl opacity-50 -z-10"
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold mb-6"
              >
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  Building the Future
                </span>
                <br />
                <span className="text-white">of Programmers</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
              >
                NCC_MSJ is a technology-driven programming community dedicated
                to developing highly skilled problem solvers and software
                innovators. Through competitive programming, collaborative
                learning, and expert mentorship, we prepare the next generation
                of technology leaders.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/register"
                  className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl text-white font-semibold text-lg overflow-hidden hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                >
                  <span className="relative z-10">Join the Community</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-400"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>

                <Link
                  href="#about"
                  className="px-8 py-4 border-2 border-green-500/50 rounded-xl text-green-400 font-semibold text-lg hover:bg-green-500/10 hover:border-green-400 transition-all duration-300"
                >
                  Learn More
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-6 h-10 border-2 border-green-500/30 rounded-full flex justify-center"
                  aria-hidden="true"
                >
                  <motion.div
                    animate={{ height: [0, 15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1 bg-green-500 rounded-full mt-2"
                  />
                </motion.div>
              </motion.div>
            </div>
          </Section>

          {/* About Section - Now using emoji instead of image */}
          <Section className="py-20" id="about">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.h2
                  className="text-4xl font-bold text-white mb-6"
                  whileHover={{ x: 10 }}
                >
                  Who We Are
                </motion.h2>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                  NCC_MSJ is a technology-driven programming community dedicated
                  to developing highly skilled problem solvers and software
                  innovators. Through competitive programming, collaborative
                  learning, and expert mentorship, we prepare the next
                  generation of technology leaders.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: "🚀",
                      text: "Empower future software engineers with cutting-edge skills",
                    },
                    {
                      icon: "💡",
                      text: "Promote problem-solving and innovative thinking",
                    },
                    {
                      icon: "🤝",
                      text: "Build a strong, supportive programming community",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-green-900/30"
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-gray-300">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-8xl mb-4 block animate-pulse">
                      👨‍💻
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Innovation Through Code
                    </h3>
                    <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full mx-auto" />
                  </div>
                </div>

                {/* Floating Cards */}
                {isMounted && (
                  <>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-4 -right-4 bg-gradient-to-br from-green-600 to-emerald-500 p-4 rounded-xl shadow-2xl"
                    >
                      <span className="text-2xl">⚡</span>
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                      className="absolute -bottom-4 -left-4 bg-gradient-to-br from-purple-600 to-pink-500 p-4 rounded-xl shadow-2xl"
                    >
                      <span className="text-2xl">💻</span>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </div>
          </Section>

          {/* Statistics Section */}
          <Section className="py-20">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Our Growing Community
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "👥",
                  label: "Total Members",
                  end: stats.members,
                  suffix: "+",
                },
                {
                  icon: "👨‍🏫",
                  label: "Expert Lecturers",
                  end: stats.lecturers,
                  suffix: "",
                },
                {
                  icon: "🏆",
                  label: "Achievements",
                  end: stats.achievements,
                  suffix: "",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="p-8 bg-white/5 backdrop-blur-sm border border-green-900/30 rounded-2xl text-center group cursor-pointer"
                >
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <Counter end={stat.end} suffix={stat.suffix} />
                  <p className="text-gray-400 mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Featured Section - Now using emoji instead of image */}
          <Section className="py-20">
            <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 mix-blend-overlay" />
              <div className="text-center z-10">
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-9xl mb-6 block"
                >
                  🤝
                </motion.span>
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold text-white mb-4"
                >
                  Where Innovation Meets Collaboration
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-gray-200 max-w-2xl mx-auto px-4"
                >
                  Join a community that's shaping the future of technology, one
                  line of code at a time.
                </motion.p>
              </div>
            </div>
          </Section>

          {/* Contact Section */}
          <Section className="py-20" id="contact">
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to Start Your Journey?
                  </h2>
                  <p className="text-gray-300 text-lg mb-6">
                    Whether you're a beginner or an experienced programmer,
                    there's a place for you in our community. Let's code the
                    future together!
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        icon: "📧",
                        text: "contact@nccmsj.tech",
                        href: "mailto:contact@nccmsj.tech",
                      },
                      {
                        icon: "📞",
                        text: "+1 (234) 567-890",
                        href: "tel:+1234567890",
                      },
                      {
                        icon: "💬",
                        text: "@nccmsj_tech",
                        href: "https://t.me/nccmsj_tech",
                      },
                    ].map((item, i) => (
                      <motion.a
                        key={i}
                        href={item.href}
                        whileHover={{ x: 10 }}
                        className="flex items-center space-x-4 text-gray-300 hover:text-green-400 transition-colors"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span>{item.text}</span>
                      </motion.a>
                    ))}
                  </div>
                </div>

                {isMounted && (
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="relative"
                  >
                    <div className="relative w-64 h-64 mx-auto">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full blur-3xl opacity-30" />
                      <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
                        <span className="text-8xl">🚀</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </Section>

          {/* Footer */}
          <footer className="py-12 border-t border-green-900/30">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">NCC_MSJ</h3>
                <p className="text-gray-400 text-sm">
                  Building the future of programmers through innovation,
                  collaboration, and excellence.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  {["Home", "About", "Events", "Courses"].map((link) => (
                    <li key={link}>
                      <Link
                        href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                        className="text-gray-400 hover:text-green-400 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Community</h4>
                <ul className="space-y-2">
                  {["Forum", "Blog", "Resources", "FAQ"].map((link) => (
                    <li key={link}>
                      <Link
                        href={`/${link.toLowerCase()}`}
                        className="text-gray-400 hover:text-green-400 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Connect</h4>
                <div className="flex space-x-4">
                  {["github", "twitter", "linkedin", "discord"].map(
                    (social) => (
                      <motion.a
                        key={social}
                        href={`https://${social}.com`}
                        whileHover={{ scale: 1.2, y: -3 }}
                        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-all"
                        aria-label={`Follow us on ${social}`}
                      >
                        <span className="text-xl capitalize">{social[0]}</span>
                      </motion.a>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-green-900/30 text-center text-gray-500 text-sm">
              <p>
                © {new Date().getFullYear()} NCC_MSJ Tech. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
