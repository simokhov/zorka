import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  describe("long-press acceleration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("steps on hold, accelerates, and stops on pointerup", () => {
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
      const plus = screen.getByRole("button", { name: "Увеличить: Вес" });

      fireEvent.pointerDown(plus, { button: 0 });
      vi.advanceTimersByTime(250);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(550);

      vi.advanceTimersByTime(750);
      const callsAfterHold = onChange.mock.calls.length;
      expect(callsAfterHold).toBeGreaterThan(2);

      fireEvent.pointerUp(plus);
      vi.advanceTimersByTime(2000);
      expect(onChange.mock.calls.length).toBe(callsAfterHold);
    });

    it("a simple click changes the value exactly once", () => {
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
      const plus = screen.getByRole("button", { name: "Увеличить: Вес" });

      fireEvent.pointerDown(plus, { button: 0 });
      fireEvent.pointerUp(plus);
      fireEvent.click(plus);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(550);

      vi.advanceTimersByTime(2000);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("stops acceleration when the pointer leaves the button", () => {
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
      const plus = screen.getByRole("button", { name: "Увеличить: Вес" });

      fireEvent.pointerDown(plus, { button: 0 });
      vi.advanceTimersByTime(500);
      const callsAtHold = onChange.mock.calls.length;

      fireEvent.pointerLeave(plus);
      vi.advanceTimersByTime(2000);
      expect(onChange.mock.calls.length).toBe(callsAtHold);
    });
  });
});
