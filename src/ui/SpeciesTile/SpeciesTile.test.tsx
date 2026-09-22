import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SpeciesTile } from "./SpeciesTile";

describe("SpeciesTile", () => {
  it("renders the species label as a pressable tile", () => {
    render(<SpeciesTile label="Щука" />);
    expect(screen.getByRole("button", { name: "Щука" })).toBeInTheDocument();
  });

  it("marks selection via aria-pressed", () => {
    render(<SpeciesTile label="Окунь" selected />);
    expect(
      screen.getByRole("button", { name: "Окунь", pressed: true }),
    ).toBeInTheDocument();
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<SpeciesTile label="Судак" onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: "Судак" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
