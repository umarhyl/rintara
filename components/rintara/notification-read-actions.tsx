"use client";

import { useState, useTransition } from "react";
import { CheckCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/domain/notifications/actions";
import { Button } from "@/components/ui/button";

export function MarkNotificationReadButton({
  notificationId,
}: {
  notificationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  return (
    <div className="grid justify-items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          setError(false);
          startTransition(async () => {
            try {
              await markNotificationRead(notificationId);
              router.refresh();
            } catch {
              setError(true);
            }
          });
        }}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <CheckCheck aria-hidden="true" />
        )}
        Tandai dibaca
      </Button>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          Gagal memperbarui
        </span>
      ) : null}
    </div>
  );
}

export function MarkAllNotificationsReadButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  return (
    <div className="grid justify-items-end gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || isPending}
        onClick={() => {
          setError(false);
          startTransition(async () => {
            try {
              await markAllNotificationsRead();
              router.refresh();
            } catch {
              setError(true);
            }
          });
        }}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <CheckCheck aria-hidden="true" />
        )}
        Tandai semua dibaca
      </Button>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          Gagal memperbarui
        </span>
      ) : null}
    </div>
  );
}
