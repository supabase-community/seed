import * as z from "zod";

export const selectConfigSchema = z.array(z.string());

export type SelectConfig = z.infer<typeof selectConfigSchema>;
