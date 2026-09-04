"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MediaPicker } from "@/components/media/media-picker";
import { useAuth } from "@/features/auth/auth-provider";
import { authorsApi } from "@/lib/api/authors";
import { useMedia } from "@/features/media/hooks";
import { z } from "zod";
import type { NormalizedApiError } from "@/types/api";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Minimal 2 karakter").max(120),
  bio: z.string().trim().max(5000).optional().or(z.literal("")),
  avatar_media_id: z.string().uuid().nullable().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current: z.string().optional(),
    next: z.string().min(8, "Password minimal 8 karakter").max(128),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Konfirmasi tidak cocok", path: ["confirm"] });
type PasswordValues = z.infer<typeof passwordSchema>;

/**
 * Halaman Profil: info akun untuk semua role; untuk role 'author'
 * (akun penulis dari halaman Authors) profil nama/bio/avatar/password
 * dapat diedit lewat endpoint /authors/me.
 */
export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Semua role yang punya profil author tertaut (termasuk admin seed
  // "Admin KabarKode") bisa mengedit profil & avatar dari halaman ini.
  const profile = useQuery({
    queryKey: ["authors", "me"],
    queryFn: authorsApi.me,
    staleTime: 5 * 60_000,
    // 404 (belum ada profil tertaut) bukan error fatal — cukup fallback.
    retry: false,
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", bio: "", avatar_media_id: null },
  });

  // Sinkronkan form saat data profil tiba.
  const loaded = profile.data;
  const [syncedId, setSyncedId] = useState<string | null>(null);
  if (loaded && syncedId !== loaded.id) {
    setSyncedId(loaded.id);
    form.reset({ name: loaded.name, bio: loaded.bio ?? "", avatar_media_id: loaded.avatar_media_id });
  }

  const avatarId = form.watch("avatar_media_id");
  const { data: avatarMedia } = useMedia(avatarId);

  const saveProfile = useMutation({
    mutationFn: (body: ProfileValues) =>
      authorsApi.updateMe({
        name: body.name.trim(),
        bio: body.bio?.trim() || null,
        avatar_media_id: body.avatar_media_id ?? null,
      }),
    onSuccess: (updated) => {
      // Perbarui cache profil + daftar author (avatar di kartu/sidebar/header).
      qc.setQueryData(["authors", "me"], updated);
      qc.invalidateQueries({ queryKey: ["authors"] });
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Profil tersimpan");
    },
    onError: (err: NormalizedApiError) => toast.error(err.message || "Gagal menyimpan profil"),
  });

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { next: "", confirm: "" },
  });

  const changePassword = useMutation({
    mutationFn: (body: PasswordValues) => authorsApi.updateMe({ password: body.next }),
    onSuccess: () => {
      pwForm.reset({ next: "", confirm: "" });
      toast.success("Password diganti");
    },
    onError: (err: NormalizedApiError) => toast.error(err.message || "Gagal mengganti password"),
  });

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground">Informasi akun dan preferensi kamu.</p>
      </div>

      {/* Akun */}
      <section className="flex items-center gap-4 rounded-2xl border bg-card p-5">
        <Avatar className="size-14">
          {profile.data?.avatar_media_id && avatarMedia && (
            <AvatarImage src={avatarMedia.public_url} alt="Avatar" />
          )}
          <AvatarFallback className="bg-black text-white">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {profile.data?.name ?? user?.email?.split("@")[0]}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">{user?.email}</p>
          <Badge variant="secondary" className="mt-1.5 rounded-full font-mono text-[10px] uppercase">
            {user?.role}
          </Badge>
        </div>
      </section>

      {profile.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : profile.data ? (
          <>
            {/* Edit profil */}
            <section className="space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Edit profil</h2>
              <div className="flex items-center gap-3">
                <Avatar className="size-14">
                  {avatarMedia && <AvatarImage src={avatarMedia.public_url} alt="Avatar" />}
                  <AvatarFallback>{form.watch("name")?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm" onClick={() => setAvatarOpen(true)}>
                  Ganti Avatar
                </Button>
              </div>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit((v) => saveProfile.mutate(v))}
              >
                <div className="grid gap-2">
                  <Label htmlFor="p-name">Nama</Label>
                  <Input id="p-name" {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-bio">Bio</Label>
                  <Textarea id="p-bio" rows={3} {...form.register("bio")} />
                </div>
                <Button type="submit" disabled={saveProfile.isPending} className="w-fit gap-2">
                  {saveProfile.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Simpan profil
                </Button>
              </form>
            </section>

            <Separator />

            {/* Ganti password */}
            <section className="space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="size-4" /> Ganti password
              </h2>
              <form
                className="grid gap-4"
                onSubmit={pwForm.handleSubmit((v) => changePassword.mutate(v))}
              >
                <div className="grid gap-2">
                  <Label htmlFor="p-new">Password baru</Label>
                  <Input id="p-new" type="password" autoComplete="new-password" {...pwForm.register("next")} />
                  {pwForm.formState.errors.next && (
                    <p className="text-sm text-destructive">{pwForm.formState.errors.next.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-confirm">Konfirmasi</Label>
                  <Input id="p-confirm" type="password" autoComplete="new-password" {...pwForm.register("confirm")} />
                  {pwForm.formState.errors.confirm && (
                    <p className="text-sm text-destructive">{pwForm.formState.errors.confirm.message}</p>
                  )}
                </div>
                <Button type="submit" variant="outline" disabled={changePassword.isPending} className="w-fit gap-2">
                  {changePassword.isPending && <Loader2 className="animate-spin" />}
                  Ganti password
                </Button>
              </form>
            </section>

            <MediaPicker
              open={avatarOpen}
              onOpenChange={setAvatarOpen}
              folder="authors"
              onSelect={(m) => {
                form.setValue("avatar_media_id", m.id);
                setAvatarOpen(false);
              }}
            />
          </>
      ) : (
        <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          Akun ini belum ditautkan ke profil author. Minta admin membuatkan
          author dengan email akun ini di halaman Authors, atau tautkan lewat
          edit author (user_id).
        </div>
      )}
    </div>
  );
}
