import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeatherLine } from "./WeatherLine";

describe("WeatherLine", () => {
  it("renders temperature and details when data is available", () => {
    render(
      <WeatherLine
        state={{ kind: "data", temperature: "+14°", details: ["ЮЗ 3 м/с"] }}
      />,
    );
    expect(screen.getByText("+14°")).toBeInTheDocument();
    expect(screen.getByText("ЮЗ 3 м/с")).toBeInTheDocument();
  });

  it("renders a muted note when weather was not recorded", () => {
    render(<WeatherLine state={{ kind: "missing" }} />);
    expect(screen.getByText("Погода не записана")).toBeInTheDocument();
    expect(screen.queryByText("+14°")).not.toBeInTheDocument();
  });

  it("renders a labelled skeleton while loading", () => {
    render(<WeatherLine state={{ kind: "loading" }} />);
    expect(
      screen.getByRole("status", { name: "Загрузка погоды" }),
    ).toBeInTheDocument();
  });
});
