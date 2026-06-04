import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const faqs = [
  {
    q: "What is SkillSwap?",
    a: "SkillSwap is an AI-powered platform that matches students, supervisors, companies, and organizations based on skills, interests, and project needs.",
  },
  {
    q: "How does AI matching work?",
    a: "Profiles, skills, and project requirements are analyzed to produce compatibility scores and ranked, explainable recommendations.",
  },
  {
    q: "Can companies use the platform?",
    a: "Yes. Companies publish recruitment requests and receive AI-recommended students who match the required skills and role profile.",
  },
  {
    q: "Can supervisors participate?",
    a: "Supervisors create projects, monitor teams, review students, and use AI to propose balanced teams from applicants.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 lg:py-24 relative scroll-mt-28">
      <div className="container max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Frequently asked <span className="text-gradient-primary">questions</span>
            </>
          }
          subtitle="Quick answers about how SkillSwap works for your role."
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
