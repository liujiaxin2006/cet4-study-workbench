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
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (data.email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setError("两次输入的邮箱不一致，请检查后再试。");
      return;
    }
    if (data.password !== confirmPassword) {
      setError("两次输入的密码不一致，请检查后再试。");
      return;
    }
    setIsLoading(true);

    try {
      const result = await postRegister(data);
      onLogin(result.user);
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof Error) {
        const errorMessage = err.message;

        if (errorMessage.includes("已注册")) {
          setError(
            "这个邮箱已注册，请直接登录。"
          );
        } else if (errorMessage.includes("暂时较多")) {
          setError(errorMessage);
        } else {
          setError("注册失败，请检查输入或稍后再试。");
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
          <FormDescription>目前不发送验证邮件，请确认邮箱填写正确。</FormDescription>
          <FormMessage />
        </FormItem>

        <div className={styles.confirmField}>
          <label htmlFor="register-confirm-email">再次输入邮箱</label>
          <Input
            id="register-confirm-email"
            placeholder="再输入一次，避免写错后无法找回账号"
            type="email"
            autoComplete="off"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            required
          />
        </div>

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
              placeholder="至少 10 位，建议使用独特的长密码"
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
            请设置至少 10 位密码；目前没有邮件找回功能，请妥善保存。
          </FormDescription>
          <FormMessage />
        </FormItem>

        <div className={styles.confirmField}>
          <label htmlFor="register-confirm-password">再次输入密码</label>
          <Input
            id="register-confirm-password"
            type="password"
            placeholder="再输入一次密码"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

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

