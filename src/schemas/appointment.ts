import { z } from "zod";

export const appointmentSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(10).max(20),
  })
  .strict();

export type AppointmentInput = z.infer<typeof appointmentSchema>;
