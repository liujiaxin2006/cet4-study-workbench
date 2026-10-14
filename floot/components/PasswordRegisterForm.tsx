import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import styles from "./PasswordRegisterForm.module.css";
import { useAuth } from "../helpers/useAuth";
import {
  schema,
  postRegister,
} from "../endpoints/auth/register_with_password_POST.schema";

export type RegisterFormData = z.infer<typeof schema>;

interface PasswordRegisterFormProps {
  className?: string;
  defaultValues?: Partial<RegisterFormData>;
}

export const PasswordRegisterForm: React.FC<PasswordRegisterFormProps> = ({
  className,
  defaultValues,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onLogin } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    schema,
    defaultValues: defaultValues || {
      email: "",
      password: "",
      displayName: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await postRegister(data);
      console.log("Registration successful for:", data.email);
      onLogin(result.user);
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof Error) {
        const errorMessage = err.message;

        if (errorMessage.includes("Email already in use")) {
          setError(
            "这个邮箱已注册，请直接登录。"
          );
        } else if (errorMessage.toLowerCase().includes("display name")) {
          setError("请输入昵称。");
        } else if (
          errorMessage.includes("display") ||
          errorMessage.includes("name")
        ) {
          setError("请检查昵称内容后再试。");
        } else {
          setError("注册失败，请检查邮箱和密码后再试。");
        }
      } else {
        console.log("Unknown error type:", err);
        setError("注册失败，请稍后重试。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form
        onSubmit={form.handleSubmit((data) =>
          handleSubmit(data as z.infer<typeof schema>)
        )}
        className={`${styles.form} ${className || ""}`}
      >
        <FormItem name="email">
          <FormLabel>邮箱</FormLabel>
          <FormControl>
            <Input
              placeholder="请输入邮箱"
              type="email"
              autoComplete="email"
              value={form.values.email || ""}
              onChange={(e) =>
                form.setValues((prev: any) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="displayName">
          <FormLabel>昵称</FormLabel>
          <FormControl>
            <Input
              id="register-display-name"
              placeholder="请输入昵称"
              value={form.values.displayName || ""}
              onChange={(e) =>
                form.setValues((prev: any) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormDescription>
            这个昵称会显示在你的学习工作台中
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="password">
          <FormLabel>密码</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="至少 8 位，含大小写字母和数字"
              autoComplete="new-password"
              value={form.values.password || ""}
              onChange={(e) =>
                form.setValues((prev: any) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormDescription>
            请设置至少 8 位密码，包含大小写字母和数字
          </FormDescription>
          <FormMessage />
        </FormItem>

        <Button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" /> 正在创建账号…
            </>
          ) : (
            "注册并开始学习"
          )}
        </Button>
      </form>
    </Form>
  );
};

