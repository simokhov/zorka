import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button, FloatInput } from "../../ui";
import { useSessionStore } from "./sessionStore";
import s from "./AuthPage.module.css";

const registerSchema = z
  .object({
    email: z.email("Введите e-mail"),
    password: z.string().min(8, "Пароль — минимум 8 символов"),
    passwordRepeat: z.string().min(1, "Повторите пароль"),
  })
  .refine((v) => v.password === v.passwordRepeat, {
    path: ["passwordRepeat"],
    message: "Пароли не совпадают",
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const signUp = useSessionStore((st) => st.signUp);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", passwordRepeat: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await signUp(email, password);
    } catch {
      setFormError(
        "Не удалось создать аккаунт. Возможно, такой e-mail уже занят.",
      );
    }
  });

  return (
    <main className={s.page}>
      <section className={s.card}>
        <h2 className={s.title}>Создать аккаунт</h2>
        <p className={s.tagline}>Дневник рыбака: места, уловы и наблюдения</p>

        <form className={s.form} onSubmit={onSubmit} noValidate>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FloatInput
                label="E-mail"
                type="email"
                autoComplete="email"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <FloatInput
                label="Пароль"
                type="password"
                autoComplete="new-password"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="passwordRepeat"
            render={({ field, fieldState }) => (
              <FloatInput
                label="Повторите пароль"
                type="password"
                autoComplete="new-password"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />

          {formError && (
            <p role="alert" className={s.formError}>
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" loading={isSubmitting}>
            Создать
          </Button>
        </form>

        <p className={s.footer}>
          Уже есть аккаунт?{" "}
          <Link to="/login" className={s.footerLink}>
            Войти
          </Link>
        </p>
      </section>
    </main>
  );
}
