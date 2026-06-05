import { Link } from "react-router-dom";
import { Calendar, CalendarPlus, MapPin, Pencil, Trash2, Wifi } from "lucide-react";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import type { StudentOrganizationEvent } from "@/api/organizationEventsApi";
import type { PublicOrganizationEventSummary } from "@/api/organizationsPublicApi";
import { ASSOCIATION_ROUTES } from "@/routes/paths";
import { formatEventDate } from "@/pages/association/events/eventFormUtils";
import { assocCard, assocDash } from "@/pages/association/dashboard/associationDashTokens";
import type { OrganizationProfileMode } from "./organizationProfileTypes";

type Props = {
  mode: OrganizationProfileMode;
  organizationId: number;
  events: StudentOrganizationEvent[];
  loading: boolean;
  deletingEventId?: number | null;
  onDeleteEvent?: (event: StudentOrganizationEvent) => void;
};

function isUpcoming(dateIso: string): boolean {
  const t = new Date(dateIso).getTime();
  return !Number.isNaN(t) && t >= Date.now() - 86_400_000;
}

export function OrganizationProfileEventsSection({
  mode,
  organizationId,
  events,
  loading,
  deletingEventId,
  onDeleteEvent,
}: Props) {
  const upcoming = events.filter((e) => isUpcoming(e.eventDate));
  const isOwner = mode === "owner";

  return (
    <section className="assoc-profile-view-card" style={assocCard}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 className="assoc-profile-section-head__title" style={{ margin: 0 }}>
          Events
        </h2>
        {isOwner ? (
          <Link to={ASSOCIATION_ROUTES.eventCreate} className="assoc-profile-btn assoc-profile-btn--primary">
            <CalendarPlus size={15} strokeWidth={2.25} aria-hidden />
            Create event
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p style={{ margin: 0, fontSize: 14, color: assocDash.muted }}>Loading events…</p>
      ) : upcoming.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: assocDash.muted }}>
          {isOwner ? "No upcoming events. Create one to show it on your public profile." : "No upcoming events."}
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
          {upcoming.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              mode={mode}
              organizationId={organizationId}
              deleting={deletingEventId === event.id}
              onDelete={onDeleteEvent ? () => onDeleteEvent(event) : undefined}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function EventRow({
  event,
  mode,
  organizationId,
  deleting,
  onDelete,
}: {
  event: StudentOrganizationEvent | PublicOrganizationEventSummary;
  mode: OrganizationProfileMode;
  organizationId: number;
  deleting?: boolean;
  onDelete?: () => void;
}) {
  const cover = event.coverImageUrl
    ? resolveApiFileUrl(event.coverImageUrl) ?? event.coverImageUrl
    : null;
  const detailPath =
    mode === "visitor"
      ? `${ASSOCIATION_ROUTES.eventDetail(event.id)}?orgId=${organizationId}`
      : ASSOCIATION_ROUTES.eventDetail(event.id);

  return (
    <li
      style={{
        ...assocCard,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        gap: 0,
      }}
    >
      {cover ? (
        <img src={cover} alt="" style={{ width: 112, height: 96, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div
          style={{
            width: 112,
            height: 96,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: assocDash.gradientCard,
            fontSize: 12,
            color: assocDash.muted,
          }}
        >
          Event
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, padding: "12px 14px" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: assocDash.text }}>{event.title}</p>
        <p
          style={{
            margin: "6px 0 0",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            fontSize: 12,
            color: assocDash.muted,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Calendar size={14} aria-hidden />
            {formatEventDate(event.eventDate)}
          </span>
          {event.isOnline ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Wifi size={14} aria-hidden />
              Online
            </span>
          ) : event.location ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <MapPin size={14} aria-hidden />
              {event.location}
            </span>
          ) : null}
        </p>
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Link
            to={detailPath}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: assocDash.accent,
              textDecoration: "none",
            }}
          >
            View event
          </Link>
          {mode === "owner" && onDelete ? (
            <>
              <Link
                to={ASSOCIATION_ROUTES.eventEdit(event.id)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: assocDash.text,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Pencil size={13} aria-hidden />
                Edit
              </Link>
              <button
                type="button"
                disabled={deleting}
                onClick={onDelete}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#b91c1c",
                  background: "none",
                  border: "none",
                  cursor: deleting ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                }}
              >
                <Trash2 size={13} aria-hidden />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}
