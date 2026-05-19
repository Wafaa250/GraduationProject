import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";

export function LandingCta() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center shadow-pop sm:p-14">
          <div className="absolute inset-0 surface-grid opacity-20" />
          <div className="relative">
            <Zap className="mx-auto h-10 w-10 text-primary-foreground" />
            <h2 className="mt-4 font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to find your perfect collaborators?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Set up in 90 seconds. Get your first AI matches instantly.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/register">
                Start matching
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
