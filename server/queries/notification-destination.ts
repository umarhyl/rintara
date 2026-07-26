type NotificationRole = "worker" | "employer" | "admin";

type NotificationReference = {
  type: string;
  entityType: string | null;
  entityId: string | null;
};

export function getNotificationDestination(
  role: NotificationRole,
  notification: NotificationReference,
) {
  if (!notification.entityId) return null;

  if (notification.entityType === "agreement") {
    return `/${role}/agreements/${notification.entityId}`;
  }

  if (
    role === "employer" &&
    notification.entityType === "job" &&
    (notification.type === "application_submitted" ||
      notification.type === "application_withdrawn")
  ) {
    return `/employer/jobs/${notification.entityId}/applicants`;
  }

  if (role === "employer" && notification.entityType === "job") {
    return `/employer/jobs/${notification.entityId}`;
  }

  if (
    role === "worker" &&
    (notification.entityType === "application" ||
      notification.entityType === "job")
  ) {
    return "/worker/applications";
  }

  return null;
}
