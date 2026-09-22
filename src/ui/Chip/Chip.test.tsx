import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "./Chip";
import { ChipRow } from "./ChipRow";

describe("Chip", () => {
  it("renders with an accessible name including the count", () => {
    render(<Chip count={12}>Щука</Chip>);
    expect(screen.getByRole("button", { name: /Щука/ })).toBeInTheDocument();
  });

  it("reflects the active state via aria-pressed", () => {
    render(<Chip active>Окунь</Chip>);
    expect(
      screen.getByRole("button", { name: "Окунь", pressed: true }),
    ).toBeInTheDocument();
  });

  it("toggles selection through onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Судак</Chip>);
    await user.click(screen.getByRole("button", { name: "Судак" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("ChipRow", () => {
  it("lays chips out in a single group", () => {
    render(
      <ChipRow>
        <Chip>Щука</Chip>
        <Chip active>Окунь</Chip>
      </ChipRow>,
    );
    expect(screen.getByRole("button", { name: "Щука" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Окунь", pressed: true }),
    ).toBeInTheDocument();
  });
});
