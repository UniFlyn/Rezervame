import { apiPost } from "@/lib/api";

export async function uploadImageDataUrl(
  dataUrl: string,
  folder = "site/hero",
): Promise<string> {
  const res = await apiPost<{ url: string }>("/storage/upload", { dataUrl, folder });
  if (!res?.url?.trim()) throw new Error("Upload did not return a URL");
  return res.url.trim();
}
