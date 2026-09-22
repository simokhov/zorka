import { describe, expect, it } from "vitest";
import { formatCatchCount } from "./format";

describe("formatCatchCount", () => {
  it("использует форму «одна поимка»", () => {
    expect(formatCatchCount(1)).toBe("1 поимка");
  });

  it("использует форму «две поимки»", () => {
    expect(formatCatchCount(2)).toBe("2 поимки");
  });

  it("использует форму «пять поимок»", () => {
    expect(formatCatchCount(5)).toBe("5 поимок");
  });

  it("работает для 11–14 (все формы на «ок»)", () => {
    expect(formatCatchCount(11)).toBe("11 поимок");
    expect(formatCatchCount(14)).toBe("14 поимок");
  });
});
