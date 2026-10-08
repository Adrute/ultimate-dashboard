import { z } from "zod";

export const globalSearchSchema = z.string().trim().min(1).max(80);
