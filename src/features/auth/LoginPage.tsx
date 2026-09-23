import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button, FloatInput } from "../../ui";
import { useSessionStore } from "./sessionStore";
import s from "./AuthPage.module.css";

const loginSchema = z.object({
  email: z.email("Введите e-mail"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const signIn = useSessionStore((st) => st.signIn);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await signIn(email, password);
    } catch {
      setFormError("Не удалось войти: проверьте e-mail и пароль");
    }
  });

  return (
    <main className={s.page}>
      <section className={s.card}>
        <h2 className={s.title}>Зорька</h2>
        <p className={s.tagline}>Дневник рыбака: места, уловы и наблюдения</p>

        <form className={s.form} onSubmit={onSubmit} noValidate>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FloatInput
                label="Логин"
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
                autoComplete="current-password"
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

          <button type="button" className={s.forgot}>
            Забыли пароль?
          </button>

          <Button type="submit" variant="primary" loading={isSubmitting}>
            Войти
          </Button>
        </form>

        <p className={s.footer}>
          Нет аккаунта?{" "}
          <Link to="/register" className={s.footerLink}>
            Создать
          </Link>
        </p>
      </section>
    </main>
  );
}
