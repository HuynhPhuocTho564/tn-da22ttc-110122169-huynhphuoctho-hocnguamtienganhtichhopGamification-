import { MS_PER_DAY } from "@/lib/gamification/constants";

export type LeaderboardPeriodType = "tuan" | "thang" | "all";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getMonthPeriod(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function getWeekPeriod(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);

  return `${utcDate.getUTCFullYear()}-W${pad2(week)}`;
}

export function getLeaderboardPeriod(type: LeaderboardPeriodType, date = new Date()) {
  return type === "tuan" ? getWeekPeriod(date) : getMonthPeriod(date);
}
