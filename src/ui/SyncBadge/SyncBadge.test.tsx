import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SyncBadge } from "./SyncBadge";

describe("SyncBadge", () => {
  it("renders the pending state", () => {
    render(<SyncBadge state="pending" />);
    expect(screen.getByText("Ждёт отправки")).toBeInTheDocument();
  });

  it("renders the syncing state with a busy indicator", () => {
    render(<SyncBadge state="syncing" />);
    expect(screen.getByText("Отправляем…")).toBeInTheDocument();
  });

  it("renders the synced state quietly", () => {
    render(<SyncBadge state="synced" />);
    expect(screen.getByText("Синхронизировано")).toBeInTheDocument();
  });

  it("renders the error state with a retry action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<SyncBadge state="error" onRetry={onRetry} />);
    expect(screen.getByText("Не отправлено")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Повторить" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
