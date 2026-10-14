import { z } from "zod";
import { User } from "../../helpers/User";
import superjson from "superjson";

export const schema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址").max(254),
  password: z.string().min(10, "密码至少需要 10 位").refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "密码过长，请控制在 72 字节以内"
  ),
  displayName: z.string().trim().min(1, "请输入昵称").max(40, "昵称最多 40 个字符"),
});

export type OutputType = {
  user: User;
};

export const postRegister = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/register_with_password`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include", // Important for cookies to be sent and received
  });

  if (!result.ok) {
    const errorData = superjson.parse<{ message: string }>(await result.text());
    throw new Error(errorData.message || "Registration failed");
  }

  return superjson.parse<OutputType>(await result.text());
};

