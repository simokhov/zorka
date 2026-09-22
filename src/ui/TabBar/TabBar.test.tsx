import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TabBar } from "./TabBar";

function renderTabBar(ui: React.ReactElement, initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>,
  );
}

const feed = { to: "/", label: "Лента", icon: "feed" as const };
const map = { to: "/map", label: "Карта", icon: "map-pin" as const };
const stats = { to: "/stats", label: "Итоги", icon: "trophy" as const };

describe("TabBar", () => {
  it("renders navigation with the four destinations", () => {
    renderTabBar(<TabBar items={[feed, map, stats]} />);
    expect(
      screen.getByRole("navigation", { name: "Основная навигация" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Лента" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Запись" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Карта" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Итоги" })).toBeInTheDocument();
  });

  it("marks the current route with aria-current", () => {
    renderTabBar(<TabBar items={[feed, map, stats]} />, "/map");
    expect(screen.getByRole("link", { name: "Карта" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Лента" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows a number badge only when more than one record is pending", () => {
    renderTabBar(<TabBar items={[{ ...feed, badge: 3 }, map, stats]} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows a dot (without a number) for a single pending record", () => {
    renderTabBar(<TabBar items={[{ ...feed, badge: 1 }, map, stats]} />);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("labels badges for screen readers", () => {
    renderTabBar(
      <TabBar items={[{ ...feed, badge: 3 }, map, { ...stats, badge: 1 }]} />,
    );
    expect(
      screen.getByRole("img", { name: "Записей в очереди: 3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Записей в очереди: 1" }),
    ).toBeInTheDocument();
  });
});
