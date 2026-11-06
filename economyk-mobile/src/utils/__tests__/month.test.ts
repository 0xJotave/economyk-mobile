import { changeMonth, getCurrentMonth } from "../month";

afterEach(() => jest.useRealTimers());

test.each([
  ["2025-12", 1, "2026-01"], ["2026-01", -1, "2025-12"],
  ["2024-01", 1, "2024-02"], ["2024-02", 1, "2024-03"],
  ["2024-03", -1, "2024-02"], ["2025-02", 1, "2025-03"],
  ["2025-03", -1, "2025-02"], ["2026-09", 1, "2026-10"],
] as const)("%s com passo %s retorna %s", (month, step, expected) => {
  expect(changeMonth(month, step)).toBe(expected);
});

test.each([
  [2024, 1, 29, "2024-02"], [2025, 1, 28, "2025-02"],
  [2025, 11, 31, "2025-12"], [2026, 0, 1, "2026-01"],
] as const)("mês atual com relógio local controlado %s/%s/%s", (year, month, day, expected) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(year, month, day, 23, 59));
  expect(getCurrentMonth()).toBe(expected);
});
