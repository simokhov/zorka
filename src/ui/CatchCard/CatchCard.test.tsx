import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CatchCard } from "./CatchCard";

describe("CatchCard", () => {
  it("renders species, weight and metadata separated by ·", () => {
    render(
      <CatchCard
        species="Щука"
        weight="1 240 г"
        metadata={["08:40", "Старица", "Спиннинг"]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Щука" })).toBeInTheDocument();
    expect(screen.getByText("1 240 г")).toBeInTheDocument();
    expect(screen.getByText("08:40 · Старица · Спиннинг")).toBeInTheDocument();
  });

  it("shows a species-icon placeholder when there is no photo", () => {
    render(<CatchCard species="Окунь" />);
    const media = screen.getByRole("button", { name: /Окунь/ });
    expect(media).toBeInTheDocument();
  });

  it("renders a photo with alt text when provided", () => {
    render(
      <CatchCard
        species="Судак"
        photo={{ src: "/p.jpg", alt: "Судак на берегу" }}
      />,
    );
    expect(screen.getByAltText("Судак на берегу")).toBeInTheDocument();
  });

  it("opens details when the card is activated", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CatchCard species="Лещ" onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: /Лещ/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
