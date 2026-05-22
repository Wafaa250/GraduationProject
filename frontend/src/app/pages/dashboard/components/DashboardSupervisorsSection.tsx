import { Sparkles, GraduationCap, Loader2 } from "lucide-react";
import ProfileLink from "../../../components/common/ProfileLink";
import {
  AiSupervisorRecommendations,
  mergeAiSupervisorCardRequestState,
  type AiSupervisionSnapshot,
  type AiSupervisorCardRequestState,
  type AiSupervisorRecommendUiState,
  type EnrichedAiSupervisorRow,
} from "../../../components/project/AiSupervisorRecommendations";
import { initialsFromName } from "../dashboardUtils";

type DashboardSupervisorsSectionProps = {
  uiState: AiSupervisorRecommendUiState;
  items: EnrichedAiSupervisorRow[];
  errorMessage: string | null;
  onRecommend: () => void;
  onRequestSupervisor: (doctorId: number) => void;
  cardRequestByDoctor: Record<number, AiSupervisorCardRequestState>;
  supervisionSnapshot: AiSupervisionSnapshot;
  supervisionPending: boolean;
  canTriggerRecommend: boolean;
  formatDoctorName: (raw: string) => string;
  hasGradProject: boolean;
};

export function DashboardSupervisorsSection(props: DashboardSupervisorsSectionProps) {
  const showCards = props.uiState === "success" && props.items.length > 0;

  return (
    <section id="sd-supervisors">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground">
            Recommended supervisors
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Faculty aligned to your project direction.
          </p>
        </div>
      </div>

      {!props.hasGradProject ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Create a graduation project to unlock supervisor recommendations.
        </div>
      ) : showCards ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {props.items.slice(0, 3).map((s) => {
            const name =
              props.formatDoctorName(s.name?.trim() || "—");
            const cardState = mergeAiSupervisorCardRequestState(
              s.doctorId,
              props.supervisionSnapshot,
              props.cardRequestByDoctor[s.doctorId],
            );
            const busy = cardState.phase === "sending";
            const requested = cardState.phase === "requested";
            const unavailable = cardState.phase === "unavailable";

            return (
              <article
                key={s.doctorId}
                className="group rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-primary-glow to-primary grid place-items-center text-primary-foreground font-display font-bold shadow-sm">
                    {initialsFromName(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-base leading-tight text-foreground">
                      <ProfileLink
                        userId={s.doctorUserId}
                        role="doctor"
                      >
                        {name}
                      </ProfileLink>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <GraduationCap className="size-3" />
                      {(s.specialization ?? "").trim() || "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-display font-bold text-primary leading-none">
                      {Math.round(s.matchScore)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      match
                    </div>
                  </div>
                </div>

                {s.reason ? (
                  <p className="mt-3 text-xs text-foreground/75 leading-relaxed flex items-start gap-1.5">
                    <Sparkles className="size-3 text-primary shrink-0 mt-0.5" /> {s.reason}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={busy || requested || unavailable || !props.canTriggerRecommend}
                  onClick={() => props.onRequestSupervisor(s.doctorId)}
                  className="mt-4 w-full text-sm font-semibold border border-primary/30 text-primary hover:bg-gradient-primary hover:text-primary-foreground hover:border-transparent rounded-xl py-2 transition-all disabled:opacity-60"
                >
                  {busy ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Sending…
                    </span>
                  ) : requested ? (
                    "Request pending"
                  ) : unavailable ? (
                    "Unavailable"
                  ) : (
                    "Request Supervision"
                  )}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-card">
          <AiSupervisorRecommendations
            embedded={false}
            uiState={props.uiState}
            items={props.items}
            errorMessage={props.errorMessage}
            onRecommend={props.onRecommend}
            onRequestSupervisor={props.onRequestSupervisor}
            cardRequestByDoctor={props.cardRequestByDoctor}
            supervisionSnapshot={props.supervisionSnapshot}
            supervisionPending={props.supervisionPending}
            canTriggerRecommend={props.canTriggerRecommend}
            formatDoctorName={props.formatDoctorName}
          />
        </div>
      )}
    </section>
  );
}
