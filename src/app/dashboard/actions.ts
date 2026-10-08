"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  createDashboardWidgetSchema,
  dashboardWidgetMutationSchema,
  moveDashboardWidgetSchema,
  resizeDashboardWidgetSchema,
} from "@/lib/dashboard/widget-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readFormValue(formData: FormData, key: string) {
  return formData.get(key);
}

export async function createDashboardWidget(formData: FormData) {
  await requireAuthenticatedUser();

  const input = createDashboardWidgetSchema.safeParse({
    layoutId: readFormValue(formData, "layoutId"),
    size: readFormValue(formData, "size"),
    spaceId: readFormValue(formData, "spaceId"),
    title: readFormValue(formData, "title"),
  });

  if (!input.success) {
    redirect("/dashboard?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { data: lastWidget, error: positionError } = await supabase
    .from("dashboard_widgets")
    .select("position")
    .eq("layout_id", input.data.layoutId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) {
    redirect("/dashboard?error=create_failed");
  }

  const { error } = await supabase.from("dashboard_widgets").insert({
    layout_id: input.data.layoutId,
    position: (lastWidget?.position ?? -1) + 1,
    size: input.data.size,
    space_id: input.data.spaceId,
    title: input.data.title,
    widget_type: "placeholder",
  });

  if (error) {
    redirect("/dashboard?error=create_failed");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=created");
}

export async function moveDashboardWidget(formData: FormData) {
  await requireAuthenticatedUser();

  const input = moveDashboardWidgetSchema.safeParse({
    direction: readFormValue(formData, "direction"),
    widgetId: readFormValue(formData, "widgetId"),
  });

  if (!input.success) {
    redirect("/dashboard?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { data: moved, error } = await supabase.rpc("move_dashboard_widget", {
    move_direction: input.data.direction,
    target_widget_id: input.data.widgetId,
  });

  if (error || !moved) {
    redirect("/dashboard?error=move_failed");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=moved");
}

export async function resizeDashboardWidget(formData: FormData) {
  await requireAuthenticatedUser();

  const input = resizeDashboardWidgetSchema.safeParse({
    size: readFormValue(formData, "size"),
    widgetId: readFormValue(formData, "widgetId"),
  });

  if (!input.success) {
    redirect("/dashboard?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .update({ size: input.data.size })
    .eq("id", input.data.widgetId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect("/dashboard?error=resize_failed");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=resized");
}

export async function removeDashboardWidget(formData: FormData) {
  await requireAuthenticatedUser();

  const input = dashboardWidgetMutationSchema.safeParse({
    widgetId: readFormValue(formData, "widgetId"),
  });

  if (!input.success) {
    redirect("/dashboard?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .delete()
    .eq("id", input.data.widgetId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect("/dashboard?error=remove_failed");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=removed");
}
