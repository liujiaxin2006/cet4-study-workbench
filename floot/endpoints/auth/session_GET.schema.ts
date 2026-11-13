import { z } from "zod";
import superjson from "superjson";
import { User } from "../../helpers/User";

// no schema, just a simple GET request
export const schema = z.object({});

export type OutputType =
  | {
      user: User;
    }
  | {
      error: string;
    };

export const getSession = async (
  body: z.infer<typeof schema> = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/auth/session`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok && result.status !== 401) throw Object.assign(new Error("登录状态暂时读取失败，请重试。"), {status:result.status});
  return superjson.parse<OutputType>(await result.text());
};

