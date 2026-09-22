import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GalleryPage } from "./GalleryPage";

describe("GalleryPage", () => {
  it("renders all component sections without errors", () => {
    render(
      <MemoryRouter>
        <GalleryPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Галерея компонентов" }),
    ).toBeInTheDocument();
    for (const name of [
      "Button",
      "Chip",
      "SpeciesTile",
      "Stepper",
      "FloatInput",
      "CatchCard",
      "SyncBadge",
      "WeatherLine",
      "OfflineBanner",
      "TabBar",
      "Галерея компонентов",
      "Сохранить поимку",
      "Нет сети",
      "Погода не записана",
      "Синхронизировано",
      "Трофей",
    ]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });
});
