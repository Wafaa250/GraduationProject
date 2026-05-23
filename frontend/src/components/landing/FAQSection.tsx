import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const faqs = [
  {
    q: "What is SkillSwap?",
    a: "SkillSwap is an AI-powered platform that intelligently matches students, supervisors, companies, and organizations based on skills, interests, and project needs.",
  },
  {
    q: "How does AI matching work?",
    a: "Our engine analyzes profiles, skills, and project requirements to compute compatibility scores, then generates ranked, explainable recommendations.",
  },
  {
    q: "Can companies use the platform?",
    a: "Yes. Companies publish recruitment requests and receive AI-recommended students who match the required skills and role profile.",
  },
  {
    q: "Can organizations recruit students?",
    a: "Absolutely. Organizations and associations can publish volunteer or member opportunities and receive curated candidate suggestions.",
  },
  {
    q: "Can supervisors participate?",
    a: "Supervisors can create projects, monitor teams, review students, and let the AI propose balanced teams from applicants.",
  },
  {
    q: "How are recommendations generated?",
    a: "Recommendations combine skill analysis, profile analysis, requirement matching, and compatibility scoring — all surfaced with the reasoning behind each match.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-32 relative">
      <div className="container max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Frequently asked <span className="text-gradient-primary">questions</span>
            </>
          }
          subtitle="Everything you need to know about SkillSwap and the AI engine behind it."
        />
        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl glass overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium pr-4">{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    <Plus className="w-5 h-5 text-primary-glow" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
