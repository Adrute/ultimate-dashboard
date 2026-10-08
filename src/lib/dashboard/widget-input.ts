import { z } from "zod";

export const dashboardWidgetSizeSchema = z.enum(["small", "medium", "large"]);

export const createDashboardWidgetSchema = z.object({
  layoutId: z.uuid(),
  size: dashboardWidgetSizeSchema,
  spaceId: z.uuid(),
  title: z.string().trim().min(1).max(60),
});

export const dashboardWidgetMutationSchema = z.object({
  widgetId: z.uuid(),
});

export const moveDashboardWidgetSchema = dashboardWidgetMutationSchema.extend({
  direction: z.enum(["up", "down"]),
});

export const resizeDashboardWidgetSchema = dashboardWidgetMutationSchema.extend(
  {
    size: dashboardWidgetSizeSchema,
  },
);
