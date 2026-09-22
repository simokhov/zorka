import { useId } from "react";
import type { ChangeEventHandler, InputHTMLAttributes } from "react";
import s from "./FloatInput.module.css";

export interface FloatInputProps {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  required?: boolean;
  name?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}

type ValueProps = {
  value?: string;
  defaultValue?: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

interface ControlProps {
  id: string;
  className?: string | undefined;
  name?: string | undefined;
  autoComplete?: string | undefined;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"] | undefined;
  maxLength?: number | undefined;
  required: boolean;
  disabled: boolean;
  placeholder: string;
  "aria-invalid"?: true | undefined;
  "aria-describedby"?: string | undefined;
  onBlur?: (() => void) | undefined;
}

export function FloatInput({
  label,
  value,
  defaultValue,
  onChange,
  onBlur,
  error,
  disabled = false,
  multiline = false,
  required = false,
  name,
  autoComplete,
  inputMode,
  maxLength,
}: FloatInputProps) {
  const autoId = useId();
  const inputId = `${autoId}-input`;
  const errorId = `${autoId}-error`;
  const hasError = error !== undefined;

  const handleNativeChange: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => {
    onChange?.(event.currentTarget.value);
  };

  const valueProps: ValueProps = {
    ...(value !== undefined ? { value } : { defaultValue: defaultValue ?? "" }),
    onChange: handleNativeChange,
  };

  const controlProps: ControlProps = {
    id: inputId,
    className: multiline ? `${s.input} ${s.textarea}` : s.input,
    name,
    autoComplete,
    inputMode,
    maxLength,
    required,
    disabled,
    placeholder: " ",
    "aria-invalid": hasError ? true : undefined,
    "aria-describedby": hasError ? errorId : undefined,
    onBlur,
  };

  return (
    <div className={s.field}>
      <div
        className={[
          s.control,
          multiline ? s.multiline : "",
          disabled ? s.disabled : "",
          hasError ? s.error : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {multiline ? (
          <textarea {...controlProps} {...valueProps} />
        ) : (
          <input type="text" {...controlProps} {...valueProps} />
        )}
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
      </div>
      {hasError && (
        <p id={errorId} role="alert" className={s.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
