import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { NOTE_ATTACHMENT_BUCKET } from "@/lib/notes/attachment-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AttachmentRouteContext = Readonly<{
  params: Promise<{ attachmentId: string }>;
}>;

export async function GET(
  request: NextRequest,
  { params }: AttachmentRouteContext,
) {
  await requireAuthenticatedUser();
  const attachmentId = z.uuid().safeParse((await params).attachmentId);
  if (!attachmentId.success) {
    return new NextResponse("Adjunto no encontrado", { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: attachment, error: attachmentError } = await supabase
    .from("attachments")
    .select("file_name,storage_path")
    .eq("id", attachmentId.data)
    .maybeSingle();
  if (attachmentError || !attachment) {
    return new NextResponse("Adjunto no encontrado", { status: 404 });
  }

  const shouldDownload = request.nextUrl.searchParams.get("download") === "1";
  const { data, error } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .createSignedUrl(
      attachment.storage_path,
      60,
      shouldDownload ? { download: attachment.file_name } : undefined,
    );
  if (error) {
    return new NextResponse("No se pudo abrir el adjunto", { status: 502 });
  }

  const response = NextResponse.redirect(data.signedUrl, 307);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
