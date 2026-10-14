import { z } from "zod";
import superjson from "superjson";

export const studyStateSchema = z.object({
  version: z.literal(1),
  minutes: z.number().int().min(0).max(1000000),
  daily: z.record(z.string(), z.object({
    minutes: z.number().int().min(0).max(60),
    completed: z.array(z.string().max(40)).max(10),
    readingChoice: z.number().int().min(0).max(3).optional(),
    translation: z.string().max(4000).optional(),
    correct: z.number().int().min(0).max(1000),
    answered: z.number().int().min(0).max(1000),
    updatedAt: z.string().datetime(),
  })),
  words: z.record(z.string(), z.object({
    repetitions: z.number().int().min(0).max(100),
    intervalDays: z.number().int().min(0).max(365),
    dueAt: z.string().datetime(),
    lastResult: z.enum(["again", "remembered"]),
  })),
  vocabularySession: z.object({
    date: z.string().max(10),
    startedAt: z.string().datetime(),
    queue: z.array(z.string().max(80)).max(30),
    total: z.number().int().min(0).max(30),
    missed: z.array(z.string().max(80)).max(30),
    deferred: z.array(z.string().max(80)).max(30),
    attempts: z.record(z.string(), z.number().int().min(0).max(3)),
  }).optional(),
  mistakes: z.array(z.object({
    id: z.string().min(1).max(100),
    area: z.enum(["reading", "listening", "vocabulary", "translation", "writing"]),
    prompt: z.string().min(1).max(1200),
    note: z.string().max(1200),
    createdAt: z.string().datetime(),
    resolved: z.boolean(),
  })).max(500),
}).strict();

export type StudyState = z.infer<typeof studyStateSchema>;
export type OutputType = { state: StudyState; revision: number };

export const getStudyProgress = async (init?: RequestInit): Promise<OutputType> => {
  const response = await fetch("/_api/study-progress", {
    method: "GET",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const result = superjson.parse<OutputType | { error: string }>(await response.text());
  if (!response.ok) throw new Error("无法读取学习进度，请稍后重试。");
  return result as OutputType;
};
