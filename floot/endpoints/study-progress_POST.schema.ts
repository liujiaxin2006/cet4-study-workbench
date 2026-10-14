import { z } from "zod";
import superjson from "superjson";
import { studyStateSchema, StudyState } from "./study-progress_GET.schema";

export const schema = z.object({
  state: studyStateSchema,
  revision: z.number().int().min(0),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { revision: number };

export const postStudyProgress = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(body);
  const response = await fetch("/_api/study-progress", {
    method: "POST",
    body: superjson.stringify(validated),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const result = superjson.parse<OutputType | { error: string }>(await response.text());
  if (!response.ok) throw new Error("error" in result ? result.error : "保存失败，请重试。");
  return result as OutputType;
};
