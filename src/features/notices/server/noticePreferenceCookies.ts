import type { NoticePreferences } from "@/types/notice";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const COOKIE_NAMES = {
  school: "jnu_notice_pref_school",
  college: "jnu_notice_pref_college",
  department: "jnu_notice_pref_department",
  center: "jnu_notice_pref_center",
  updatedAt: "jnu_notice_pref_updated_at",
} as const;

type CookieReader = {
  get(name: string): { value?: string } | undefined;
};

function parseList(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readNoticePreferencesFromCookieStore(cookieStore: CookieReader): NoticePreferences | null {
  const schoolCategoryKeys = parseList(cookieStore.get(COOKIE_NAMES.school)?.value);
  const collegeKeys = parseList(cookieStore.get(COOKIE_NAMES.college)?.value);
  const departmentKeys = parseList(cookieStore.get(COOKIE_NAMES.department)?.value);
  const centerKeys = parseList(cookieStore.get(COOKIE_NAMES.center)?.value);
  const updatedAt = cookieStore.get(COOKIE_NAMES.updatedAt)?.value;

  const hasAnySelection =
    schoolCategoryKeys.length > 0 ||
    collegeKeys.length > 0 ||
    departmentKeys.length > 0 ||
    centerKeys.length > 0;

  if (!hasAnySelection && !updatedAt) {
    return null;
  }

  return {
    schoolCategoryKeys,
    collegeKeys,
    departmentKeys,
    centerKeys,
    updatedAt: updatedAt || new Date().toISOString(),
  };
}

export function readNoticePreferencesFromRequest(request: NextRequest): NoticePreferences | null {
  return readNoticePreferencesFromCookieStore(request.cookies);
}

export function applyNoticePreferencesCookies(
  response: NextResponse,
  preferences: NoticePreferences,
) {
  response.cookies.set(COOKIE_NAMES.school, preferences.schoolCategoryKeys.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(COOKIE_NAMES.college, preferences.collegeKeys.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(COOKIE_NAMES.department, preferences.departmentKeys.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(COOKIE_NAMES.center, preferences.centerKeys.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(COOKIE_NAMES.updatedAt, preferences.updatedAt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}
