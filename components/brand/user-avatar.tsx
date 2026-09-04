"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useMedia } from "@/features/media/hooks";
import { authorsApi } from "@/lib/api/authors";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";

/** Avatar media by id — fallback inisial nama. */
export function MediaAvatar({
  mediaId,
  name,
  className,
  fallbackClassName,
}: {
  mediaId: string | null | undefined;
  name: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
}) {
  const { data: media } = useMedia(mediaId);
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  return (
    <Avatar className={className}>
      {media && <AvatarImage src={media.public_url} alt={name ?? "Avatar"} />}
      <AvatarFallback className={cn("bg-primary text-primary-foreground", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * Avatar user login — SEMUA role: bila akun tertaut ke profil author
 * (/authors/me -> avatar_media_id; seed admin juga punya profil
 * "Admin KabarKode"), tampilkan gambar avatar profil; jika tidak ada
 * profil/terkait, fallback ke inisial email.
 */
export function UserAvatar({
  className,
  fallbackClassName,
}: {
  className?: string;
  fallbackClassName?: string;
}) {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ["authors", "me"],
    queryFn: authorsApi.me,
    staleTime: 5 * 60_000,
    // 404 (belum ada profil tertaut) bukan error fatal — cukup fallback.
    retry: false,
  });
  return (
    <MediaAvatar
      mediaId={profile.data?.avatar_media_id}
      name={profile.data?.name ?? user?.email?.split("@")[0] ?? "?"}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  );
}
