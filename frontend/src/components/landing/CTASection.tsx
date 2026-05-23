import { motion } from "framer-motion";
import { ArrowRight, Compass } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 lg:py-32 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl p-10 lg:p-20 text-center"
        >
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Start Building Better
              <br />
              Teams Today
            </h2>
            <p className="mt-5 text-base lg:text-lg text-white/80 max-w-xl mx-auto">
              Join the platform that&apos;s transforming how students, supervisors, companies, and
              organizations collaborate.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-white text-primary-dark font-semibold rounded-xl shadow-2xl hover:-translate-y-0.5 transition-all"
              >
                Create Account
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                <Compass className="w-4 h-4" />
                Explore Platform
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
