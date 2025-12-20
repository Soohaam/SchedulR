'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import Clock3D from '@/components/landing/Clock3D';
import { Calendar, CheckCircle, BarChart3, Users, Clock, Shield } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Redirect authenticated users to their dashboard (only once)
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'ORGANISER'
        ? '/organizer'
        : user.role === 'ADMIN'
          ? '/admin'
          : '/user';

      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 font-sans selection:bg-accent/30">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">S</div>
          <h1 className="text-2xl font-bold text-primary tracking-tight font-['Georgia']">Schedulr</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="text-foreground hover:text-accent transition-colors font-medium text-base">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="metallic-gold-bg text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/20 transition-all border-0 font-semibold px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Column: Text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-2xl"
          >
            <motion.h2
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold text-primary leading-[1.1] tracking-tight font-['Georgia']"
            >
              Booking Simplified. <br />
              <span className="metallic-gold-text">Schedule Smarter.</span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-lg"
            >
              Experience intelligent scheduling with real-time availability, multi-provider coordination, and powerful automation designed for modern professionals.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link href="/register">
                <Button size="lg" className="metallic-gold-bg text-accent-foreground hover:opacity-90 text-lg px-8 py-6 shadow-xl shadow-accent/30 rounded-xl transition-all hover:scale-105 border-0 font-semibold w-full sm:w-auto">
                  Book Appointment
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg" className="bg-secondary/50 hover:bg-secondary text-foreground hover:text-accent text-lg px-8 py-6 rounded-xl transition-all border-0 font-medium w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>14-day free trial</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: 3D Clock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-full min-h-[400px] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <Clock3D />
          </motion.div>
        </div>

        {/* Below Hero Sections */}
        <div className="mt-24 space-y-24">

          {/* Upcoming Appointments Preview */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-primary font-['Georgia'] mb-4">Seamless Appointment Management</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">Keep track of your schedule with our intuitive dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Strategy Session", date: "Today, 2:00 PM", provider: "Dr. Sarah Smith", type: "Video Call" },
                { title: "Quarterly Review", date: "Tomorrow, 10:00 AM", provider: "John Doe", type: "In-Person" },
                { title: "Client Onboarding", date: "Fri, Oct 24, 11:30 AM", provider: "Emily White", type: "Video Call" }
              ].map((item, i) => (
                <div key={i} className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col gap-4 group">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">{item.type}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-card-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.date}</p>
                  </div>
                  <div className="pt-4 mt-auto border-t border-border/50 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10"></div>
                    <span className="text-sm text-muted-foreground">{item.provider}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Calendar & Analytics Preview */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-secondary/30 rounded-3xl p-8 md:p-12 border border-border/50"
          >
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-primary font-['Georgia']">Data-Driven Insights</h3>
              <p className="text-muted-foreground text-lg">
                Optimize your availability with powerful analytics. Understand peak booking times, revenue trends, and staff performance at a glance.
              </p>
              <ul className="space-y-4">
                {[
                  "Real-time availability updates",
                  "Smart capacity management",
                  "Automated reminders & notifications",
                  "Detailed revenue reports"
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <span className="text-foreground/80">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl"></div>
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-card-foreground">Weekly Overview</h4>
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between gap-2 h-40">
                  {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                    <div key={i} className="w-full bg-secondary rounded-t-lg relative group overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-accent/80 transition-all duration-500 group-hover:bg-accent"
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Feature Highlights */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="pb-20"
          >
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-primary font-['Georgia'] mb-4">Everything You Need</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">Powerful features built for teams of all sizes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Clock, title: "Real-time Availability", desc: "Syncs instantly across all devices to prevent double bookings." },
                { icon: Users, title: "Multi-Provider", desc: "Manage schedules for your entire team in one place." },
                { icon: BarChart3, title: "Capacity Rules", desc: "Set limits on bookings per day or time slot automatically." },
                { icon: Shield, title: "Admin Controls", desc: "Granular permissions and comprehensive audit logs." }
              ].map((feature, i) => (
                <div key={i} className="bg-background border border-border/50 rounded-xl p-6 hover:border-accent/50 transition-colors duration-300 group">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-primary mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

        </div>
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border/40 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2025 Schedulr. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-accent transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-accent transition-colors">Terms</Link>
            <Link href="#" className="hover:text-accent transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
