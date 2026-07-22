"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ConfirmAction({
  triggerLabel,
  title,
  description,
  confirmLabel,
  destructive = false,
  disabled = false,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" className="h-11" disabled={disabled} variant={destructive ? "destructive" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <span className="mb-1 grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle aria-hidden="true" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="leading-6">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" className="h-11">Kembali</Button></DialogClose>
          <DialogClose asChild>
            <Button type="button" className="h-11" variant={destructive ? "destructive" : "default"}>{confirmLabel}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
