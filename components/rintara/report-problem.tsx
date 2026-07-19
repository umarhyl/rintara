"use client";

import { Flag } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ReportProblem() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-11">
          <Flag aria-hidden="true" />
          Laporkan masalah
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan masalah</DialogTitle>
          <DialogDescription className="text-base leading-7">
            Gunakan keterangan faktual. Laporan dapat menjeda penyelesaian
            pekerjaan terkait, tetapi Rintara tidak menyelesaikan sengketa hukum
            atau pembayaran.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="report-reason">Alasan laporan</Label>
            <Select>
              <SelectTrigger
                id="report-reason"
                className="h-11 w-full"
                aria-label="Alasan laporan"
              >
                <SelectValue placeholder="Pilih alasan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terms">Ketentuan tidak sesuai</SelectItem>
                <SelectItem value="attendance">Masalah kehadiran</SelectItem>
                <SelectItem value="safety">Kekhawatiran keamanan</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-description">
              Keterangan{" "}
              <span className="font-normal text-muted-foreground">
                (opsional)
              </span>
            </Label>
            <Textarea
              id="report-description"
              placeholder="Jelaskan kejadian dan waktu secara ringkas"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-11">
              Kembali
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" className="h-11">
              Kirim laporan
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
