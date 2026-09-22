import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("increments and decrements by step", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Stepper
        label="Вес"
        value={500}
        unit="г"
        step={50}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Увеличить: Вес" }));
    expect(onChange).toHaveBeenLastCalledWith(550);
    await user.click(screen.getByRole("button", { name: "Уменьшить: Вес" }));
    expect(onChange).toHaveBeenLastCalledWith(450);
  });

  it("offers an editable input with a dash placeholder for an unset value", () => {
    render(<Stepper label="Длина" unit="мм" />);
    expect(screen.getByRole("spinbutton", { name: "Длина" })).toHaveValue(null);
    expect(screen.getByPlaceholderText("—")).toBeInTheDocument();
  });

  it("accepts typed input from an unset value", () => {
    const onValueInput = vi.fn();
    render(<Stepper label="Длина" unit="мм" onValueInput={onValueInput} />);
    const input = screen.getByRole("spinbutton", { name: "Длина" });
    fireEvent.change(input, { target: { value: "42" } });
    expect(onValueInput).toHaveBeenLastCalledWith(42);
  });

  it("clamps the value to the range bounds", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Stepper
        label="Вес"
        value={100}
        unit="г"
        step={50}
        min={0}
        max={150}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Увеличить: Вес" }));
    expect(onChange).toHaveBeenLastCalledWith(150);
  });

  it("renders a range error without resetting the value", () => {
    render(
      <Stepper label="Вес" value={20000} unit="г" error="Слишком много" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Слишком много");
    expect(screen.getByRole("spinbutton", { name: "Вес" })).toHaveValue(20000);
  });
});
