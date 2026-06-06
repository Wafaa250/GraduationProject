import { Redirect } from "expo-router";

import { ASSOCIATION_ROUTES } from "@/lib/associationRoutes";

/** Web uses settings route for the same profile page when profile is incomplete. */
export default function AssociationSettingsScreen() {
  return <Redirect href={ASSOCIATION_ROUTES.profile} />;
}
