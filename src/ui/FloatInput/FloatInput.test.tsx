import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FloatInput } from "./FloatInput";

describe("FloatInput", () => {
  it("associates the floating label with the field", () => {
    render(<FloatInput label="Место ловли" />);
    expect(screen.getByLabelText("Место ловли")).toBeInTheDocument();
  });

  it("emits changes while typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FloatInput label="Место ловли" onChange={onChange} />);
    await user.type(screen.getByLabelText("Место ловли"), "Старица");
    expect(onChange).toHaveBeenLastCalledWith("Старица");
  });

  it("exposes the error text as an alert and marks the field invalid", () => {
    render(<FloatInput label="Место ловли" error="Укажите место" />);
    const input = screen.getByLabelText("Место ловли");
    expect(input).toBeInvalid();
    expect(screen.getByRole("alert")).toHaveTextContent("Укажите место");
    expect(input).toHaveAccessibleDescription("Укажите место");
  });

  it("renders disabled fields as inert", () => {
    render(<FloatInput label="Заметка" defaultValue="..." disabled />);
    expect(screen.getByLabelText("Заметка")).toBeDisabled();
  });

  it("supports native input types and ref forwarding", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <FloatInput
        label="Пароль"
        type="password"
        name="password"
        autoComplete="new-password"
        ref={ref}
      />,
    );
    const input = screen.getByLabelText("Пароль");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("name", "password");
    expect(input).toHaveAttribute("autoComplete", "new-password");
    expect(ref.current).toBe(input);
  });

  it("supports the multiline note variant", () => {
    render(<FloatInput label="Заметка" multiline />);
    const textarea = screen.getByLabelText("Заметка");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("works as a controlled field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <FloatInput label="Приманка" value="" onChange={onChange} />,
    );
    await user.type(screen.getByLabelText("Приманка"), "в");
    expect(onChange).toHaveBeenLastCalledWith("в");
    rerender(
      <FloatInput label="Приманка" value="воблер" onChange={onChange} />,
    );
    expect(screen.getByLabelText("Приманка")).toHaveValue("воблер");
  });
});
