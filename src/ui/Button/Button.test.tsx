import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders as a button with an accessible name", () => {
    render(<Button>Сохранить поимку</Button>);
    expect(
      screen.getByRole("button", { name: "Сохранить поимку" }),
    ).toBeInTheDocument();
  });

  it("is disabled and inert when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Сохранить
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Сохранить" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("in loading state replaces text with a busy indicator and stays disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Сохранить
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(screen.queryByText("Сохранить")).not.toBeInTheDocument();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onClick when enabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Добавить фото</Button>);
    await user.click(screen.getByRole("button", { name: "Добавить фото" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
