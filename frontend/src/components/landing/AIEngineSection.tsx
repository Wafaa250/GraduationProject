import { motion } from "framer-motion";
import { Brain, FileSearch, Layers, Sparkles, Target, UserSearch } from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const capabilities = [
  {
    icon: Layers,
    title: "Skill Analysis",
    desc: "Maps and weighs every skill across technical and soft dimensions.",
  },
  {
    icon: UserSearch,
    title: "Profile Analysis",
    desc: "Understands experience, interests, and collaboration history.",
  },
  {
    icon: FileSearch,
    title: "Requirement Matching",
    desc: "Parses project briefs and opportunities into structured needs.",
  },
  {
    icon: Target,
    title: "Compatibility Scoring",
    desc: "Generates ranked scores across multiple compatibility axes.",
  },
  {
    icon: Sparkles,
    title: "Recommendation Generation",
    desc: "Produces explainable suggestions, not opaque results.",
  },
];

function NetworkVisual() {
  const nodes = [
    { x: 50, y: 50, size: 38, primary: true },
    { x: 18, y: 22, size: 18 },
    { x: 82, y: 18, size: 16 },
    { x: 14, y: 70, size: 14 },
    { x: 86, y: 78, size: 20 },
    { x: 50, y: 12, size: 12 },
    { x: 50, y: 88, size: 16 },
    { x: 32, y: 88, size: 12 },
    { x: 70, y: 90, size: 14 },
  ];

  return (
    <div className="relative aspect-square w-full max-w-[520px] mx-auto">
      <div className="absolute inset-0 bg-gradient-radial opacity-60 animate-glow-pulse" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <linearGradient id="netline" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(239 84% 67%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(258 90% 66%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {nodes.slice(1).map((node, index) => (
          <motion.line
            key={index}
            x1={50}
            y1={50}
            x2={node.x}
            y2={node.y}
            stroke="url(#netline)"
            strokeWidth="0.3"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: index * 0.08 }}
          />
        ))}
        {nodes.map((node, index) => (
          <motion.circle
            key={`node-${index}`}
            cx={node.x}
            cy={node.y}
            r={node.size / 12}
            fill={node.primary ? "url(#netline)" : "hsl(239 84% 67%)"}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + index * 0.05, type: "spring" }}
          />
        ))}
      </svg>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl glass flex items-center justify-center shadow-[0_0_60px_hsl(var(--primary)/0.7)]"
      >
        <Brain className="w-8 h-8 text-white" strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

export function AIEngineSection() {
  return (
    <section className="py-20 lg:py-32 relative">
      <div className="container">
        <SectionHeading
          eyebrow="AI Engine"
          title={
            <>
              Powered by <span className="text-gradient-primary">Intelligent Matching</span>
            </>
          }
          subtitle="A purpose-built engine that understands people, projects, and how to bring them together."
        />
        <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center">
          <NetworkVisual />
          <div className="space-y-3">
            {capabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group flex gap-4 p-4 rounded-xl glass hover:bg-white/[0.06] transition-all"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[0_4px_20px_hsl(var(--primary)/0.3)] group-hover:scale-110 transition-transform">
                  <capability.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{capability.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {capability.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
