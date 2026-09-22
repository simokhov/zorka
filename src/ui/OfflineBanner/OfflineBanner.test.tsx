import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfflineBanner } from "./OfflineBanner";

describe("OfflineBanner", () => {
  it("announces the offline state politely with the default texts", () => {
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Нет сети")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Запись сохранится на устройстве и отправится при появлении связи",
      ),
    ).toBeInTheDocument();
  });

  it("allows overriding the explanation", () => {
    render(<OfflineBanner description="Черновик не будет потерян" />);
    expect(screen.getByText("Черновик не будет потерян")).toBeInTheDocument();
  });
});
