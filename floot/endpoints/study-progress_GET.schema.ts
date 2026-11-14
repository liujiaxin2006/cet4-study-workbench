import { z } from "zod";
import superjson from "superjson";

export const studyStateSchema = z.object({
  version: z.literal(1),
  minutes: z.number().int().min(0).max(1000000),
  daily: z.record(z.string(), z.object({
    minutes: z.number().int().min(0).max(180),
    completed: z.array(z.string().max(40)).max(10),
    readingChoice: z.number().int().min(0).max(3).optional(),
    readingAnswers: z.array(z.number().int().min(0).max(3)).length(5).optional(),
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
    lastReviewedAt:z.string().datetime().optional(),
    delayedSuccesses:z.number().int().min(0).max(100).optional(),
    history:z.array(z.object({at:z.string().datetime(),remembered:z.boolean(),delayed:z.boolean(),intervalDays:z.number().min(0).max(365)})).max(20).optional(),
  })),
  preferences:z.object({examDate:z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+"T00:00:00Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;},"考试日期无效"),dailyMinutes:z.union([z.literal(30),z.literal(60),z.literal(90)]),focus:z.enum(["auto","reading","listening","writing"]),wordCount:z.union([z.literal(10),z.literal(20)]).optional(),textSize:z.enum(['standard','large']).optional()}).optional(),
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
    reviewStage:z.number().int().min(0).max(3).optional(),
    dueAt:z.string().datetime().optional(),
    lastReviewedAt:z.string().datetime().optional(),
    reviewAttempts:z.number().int().min(0).max(100000).optional(),
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
