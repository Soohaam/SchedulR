'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold text-xl shadow-lg shadow-accent/20">S</div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Schedulr</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="text-foreground hover:text-accent transition-colors font-medium">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="metallic-gold-bg text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/20 transition-all border-0">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto w-full pt-10 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h2 className="text-5xl md:text-7xl font-bold text-primary leading-tight tracking-tight">
            Booking Simplified. <br />
            <span className="metallic-gold-text">Schedule Smarter.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            Streamline your appointment scheduling with our premium, intuitive platform designed for professionals and organizers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/register">
              <Button size="lg" className="metallic-gold-bg text-accent-foreground hover:opacity-90 text-lg px-8 py-6 shadow-xl shadow-accent/30 rounded-xl transition-all hover:scale-105 border-0 font-semibold">
                Book Appointment
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-2 border-input hover:border-accent hover:text-accent text-lg px-8 py-6 rounded-xl transition-all bg-transparent font-medium">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Visual Element Placeholder */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-20 w-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 h-full w-full pointer-events-none"></div>
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl p-4 md:p-8 max-w-4xl mx-auto transform rotate-x-12 perspective-1000 backdrop-blur-sm">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mock Cards */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-background/50 rounded-xl p-6 shadow-sm border border-border/50 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent">
                      <div className="w-6 h-6 bg-accent/20 rounded-full"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-muted/50 rounded-full"></div>
                      <div className="h-3 w-2/3 bg-muted/50 rounded-full"></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border/40">
        © 2025 Schedulr. All rights reserved.
      </footer>
    </div>
  );
}
