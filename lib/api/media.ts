import axios from "axios";
import { apiRequest } from "@/lib/api/client";
import type { Media, PresignResult } from "@/types/models";

export interface PresignInput {
  file_name: string;
  mime_type: string;
  size: number;
  slug?: string;
  folder?: "articles" | "authors" | "assets";
}

/**
 * Alur upload (requirement §27):
 * 1. POST /media/presign  -> dapat uploadUrl (presigned PUT)
 * 2. PUT binary ke MinIO via uploadUrl (tanpa Authorization header)
 * 3. POST /media          -> registrasi metadata, dapat Media row
 *
 * CATATAN KONTRAK: backend saat ini men-sign presigned URL dengan host
 * internal `minio:9000` sehingga TIDAK bisa dipakai browser (lihat README
 * "Backend contract gaps"). Fungsi ini mengikuti kontrak yang benar —
 * begitu backend men-sign dengan endpoint publik, CMS tidak perlu berubah.
 */
export const mediaApi = {
  presign(body: PresignInput): Promise<PresignResult> {
    return apiRequest<PresignResult>({ method: "POST", url: "/media/presign", data: body }).then(
      (r) => r.data,
    );
  },

  /** PUT langsung ke storage — axios polos, BUKAN instance API (jangan bawa Bearer token ke MinIO). */
  async putToPresignedUrl(uploadUrl: string, file: File, contentType: string): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": contentType },
      timeout: 120_000,
    });
  },

  register(body: {
    file_name: string;
    object_key: string;
    mime_type: string;
    size: number;
  }): Promise<Media> {
    return apiRequest<Media>({ method: "POST", url: "/media", data: body }).then((r) => r.data);
  },

  get(id: string): Promise<Media> {
    return apiRequest<Media>({ method: "GET", url: `/media/${id}` }).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return apiRequest<null>({ method: "DELETE", url: `/media/${id}` }).then(() => undefined);
  },

  /** Gabungan tiga langkah di atas — dipakai MediaPicker & halaman Media. */
  async upload(file: File, folder: PresignInput["folder"] = "articles"): Promise<Media> {
    const presign = await this.presign({
      file_name: file.name,
      mime_type: file.type,
      size: file.size,
      folder,
    });
    await this.putToPresignedUrl(presign.uploadUrl, file, file.type);
    return this.register({
      file_name: file.name,
      object_key: presign.objectKey,
      mime_type: file.type,
      size: file.size,
    });
  },
};
