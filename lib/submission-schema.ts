import { z } from "zod";

export const submissionTypes = [
  "submit-loop",
  "request-loop",
  "improve-loop",
] as const;

export const visibilityModes = ["public", "private"] as const;

export const loopSubmissionSchema = z.object({
  submissionType: z.enum(submissionTypes),
  visibility: z.enum(visibilityModes).optional().default("public"),
  title: z
    .string()
    .trim()
    .min(4, "Write at least 4 characters for the title.")
    .max(120, "Keep the title under 120 characters."),
  outcome: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters for what this helps someone do.")
    .max(1200, "Keep the outcome under 1200 characters."),
  steps: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters for the rough steps.")
    .max(2500, "Keep the steps under 2500 characters."),
  context: z.string().trim().max(1000).optional().default(""),
  handle: z.string().trim().max(120).optional().default(""),
  website: z.string().trim().max(0).optional().default(""),
});

export type LoopSubmission = z.infer<typeof loopSubmissionSchema>;
