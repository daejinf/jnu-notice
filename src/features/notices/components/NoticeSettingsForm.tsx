"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { selectableCenters, selectableCenterKeys } from "@/data/selectableCenters";
import { selectableColleges, selectableCollegeKeys } from "@/data/selectableColleges";
import { selectableDepartments, selectableDepartmentKeys } from "@/data/selectableDepartments";
import {
  selectableSchoolCategories,
  selectableSchoolCategoryKeys,
} from "@/data/selectableSchoolCategories";
import {
  buildScopedStorageKey,
  CENTER_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  SCHOOL_STORAGE_KEY,
} from "@/features/notices/constants/storageKeys";
import { useSelectedCategories } from "@/features/notices/hooks/useSelectedCategories";
import type { NoticePreferences } from "@/types/notice";

const PROJECT_CENTER_KEYS = ["greenbio", "battery", "sw-core", "sw-core-education", "aicoss", "juice-semi", "nccoss"];

type NoticePreferencesResponse = {
  preferences: NoticePreferences | null;
  error?: string;
};

function SelectionSection({
  title,
  description,
  sectionTone,
  accentClass,
  buttonClass,
  items,
  selectedKeys,
  onToggle,
  onSelectAll,
  onClear,
}: {
  title: string;
  description: string;
  sectionTone: string;
  accentClass: string;
  buttonClass: string;
  items: Array<{ key: string; title: string; subtitle: string }>;
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <section className={`rounded-[32px] border p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] sm:p-6 ${sectionTone}`}>
      <div className="flex flex-col gap-4 border-b border-black/5 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${buttonClass}`}
          >
            ?? ??
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ?? ??
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => {
          const checked = selectedKeys.includes(item.key);

          return (
            <label
              key={item.key}
              className={`flex cursor-pointer items-start gap-3 rounded-[24px] border px-4 py-4 transition shadow-[0_6px_16px_rgba(15,23,42,0.03)] ${checked ? accentClass : "border-slate-200 bg-white/88 hover:bg-white"}`}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(item.key)} className="mt-1 h-4 w-4" />
              <div>
                <p className="font-bold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function DepartmentSelectionSection({
  selectedKeys,
  onToggle,
  onSelectAll,
  onClear,
}: {
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredGroups = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const groupedMap = new Map<string, typeof selectableDepartments>();

    selectableDepartments.forEach((department) => {
      const matchesKeyword =
        keyword.length === 0 ||
        department.college.toLowerCase().includes(keyword) ||
        department.department.toLowerCase().includes(keyword);

      if (!matchesKeyword) return;

      const currentGroup = groupedMap.get(department.college) ?? [];
      currentGroup.push(department);
      groupedMap.set(department.college, currentGroup);
    });

    return Array.from(groupedMap.entries()).map(([college, departments]) => ({ college, departments }));
  }, [searchKeyword]);

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-violet-200/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">?? ??</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ???? ???? ??? ??, ??? ???? ??? ??? ???? ?? ? ????.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSelectAll} className="rounded-2xl bg-[#3182F6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B64DA]">
            ?? ??
          </button>
          <button type="button" onClick={onClear} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            ?? ??
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label className="text-sm font-semibold text-violet-800">?? ??</label>
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="?: ????, ?????, ??????"
          className="mt-2 h-13 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#3182F6]"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {filteredGroups.map((group) => (
          <div key={group.college} className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-4">
            <div className="border-b border-violet-100 pb-3">
              <p className="text-base font-bold text-slate-950">{group.college}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{group.departments.length}? ??</p>
            </div>
            <div className="mt-4 grid gap-2">
              {group.departments.map((department) => {
                const checked = selectedKeys.includes(department.key);
                return (
                  <label
                    key={department.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-[22px] border px-4 py-3.5 transition ${checked ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => onToggle(department.key)} className="mt-1 h-4 w-4" />
                    <div>
                      <p className="font-semibold text-slate-950">{department.department}</p>
                      <p className="mt-1 text-sm text-slate-500">{group.college}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-violet-300 bg-white/80 px-4 py-14 text-center text-sm text-slate-500">
          ?? ??? ?? ??? ????.
        </div>
      ) : null}
    </section>
  );
}

export function NoticeSettingsForm({ storageScope }: { storageScope: string }) {
  const schoolSelection = useSelectedCategories(selectableSchoolCategoryKeys, {
    storageKey: buildScopedStorageKey(SCHOOL_STORAGE_KEY, storageScope),
  });
  const collegeSelection = useSelectedCategories(selectableCollegeKeys, {
    storageKey: buildScopedStorageKey(COLLEGE_STORAGE_KEY, storageScope),
  });
  const departmentSelection = useSelectedCategories(selectableDepartmentKeys, {
    storageKey: buildScopedStorageKey(DEPARTMENT_STORAGE_KEY, storageScope),
  });
  const centerSelection = useSelectedCategories(selectableCenterKeys, {
    storageKey: buildScopedStorageKey(CENTER_STORAGE_KEY, storageScope),
  });

  const [isHydratingServer, setIsHydratingServer] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const hasFetchedServerPreferences = useRef(false);

  const isReady =
    schoolSelection.isReady &&
    collegeSelection.isReady &&
    departmentSelection.isReady &&
    centerSelection.isReady;

  const institutionCenters = useMemo(() => selectableCenters.filter((center) => !PROJECT_CENTER_KEYS.includes(center.key)), []);
  const projectCenters = useMemo(() => selectableCenters.filter((center) => PROJECT_CENTER_KEYS.includes(center.key)), []);

  useEffect(() => {
    if (!isReady || hasFetchedServerPreferences.current) return;

    const controller = new AbortController();
    hasFetchedServerPreferences.current = true;

    const run = async () => {
      try {
        const response = await fetch("/api/notice-preferences", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as NoticePreferencesResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "?? ??? ???? ?????.");
        }

        if (data.preferences) {
          schoolSelection.setSelectedCategories(
            data.preferences.schoolCategoryKeys.filter((value) => selectableSchoolCategoryKeys.includes(value)),
          );
          collegeSelection.setSelectedCategories(
            data.preferences.collegeKeys.filter((value) => selectableCollegeKeys.includes(value)),
          );
          departmentSelection.setSelectedCategories(
            data.preferences.departmentKeys.filter((value) => selectableDepartmentKeys.includes(value)),
          );
          centerSelection.setSelectedCategories(
            data.preferences.centerKeys.filter((value) => selectableCenterKeys.includes(value)),
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setSyncStatus("error");
        setSyncMessage(error instanceof Error ? error.message : "?? ??? ???? ?????.");
      } finally {
        setIsHydratingServer(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [
    centerSelection,
    centerSelection.setSelectedCategories,
    collegeSelection,
    collegeSelection.setSelectedCategories,
    departmentSelection,
    departmentSelection.setSelectedCategories,
    isReady,
    schoolSelection,
    schoolSelection.setSelectedCategories,
  ]);

  useEffect(() => {
    if (!isReady || isHydratingServer) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSyncStatus("saving");
        setSyncMessage("??? ???? ???? ????.");

        const response = await fetch("/api/notice-preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            schoolCategoryKeys: schoolSelection.selectedCategories,
            collegeKeys: collegeSelection.selectedCategories,
            departmentKeys: departmentSelection.selectedCategories,
            centerKeys: centerSelection.selectedCategories,
          }),
          signal: controller.signal,
        });
        const data = (await response.json()) as NoticePreferencesResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "?? ??? ???? ?????.");
        }

        setSyncStatus("saved");
        setSyncMessage("? ??? ?? ??? ???? ???????.");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setSyncStatus("error");
        setSyncMessage(error instanceof Error ? error.message : "?? ??? ???? ?????.");
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    centerSelection.selectedCategories,
    collegeSelection.selectedCategories,
    departmentSelection.selectedCategories,
    isHydratingServer,
    isReady,
    schoolSelection.selectedCategories,
  ]);

  function selectCenterGroup(keys: string[]) {
    centerSelection.setSelectedCategories((current: string[]) => Array.from(new Set([...current, ...keys])));
  }

  function clearCenterGroup(keys: string[]) {
    centerSelection.setSelectedCategories((current: string[]) => current.filter((key: string) => !keys.includes(key)));
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">?? ??</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">?? ?? ??? ?????</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          ?? ??, ???, ??, ?? ??, ??? ?? ??? ??? ??? ?? ?? ? ????.
          ??? ?? ??? ??? ??? ????? ??????.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700">
            {isHydratingServer ? "?? ?? ???? ?" : "??? ? ?? ???? ??????"}
          </span>
          {syncMessage ? (
            <span
              className={`rounded-full px-4 py-2 font-semibold ${
                syncStatus === "error"
                  ? "bg-rose-100 text-rose-700"
                  : syncStatus === "saved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-sky-100 text-sky-700"
              }`}
            >
              {syncMessage}
            </span>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SelectionSection
          title="?? ??"
          description="??, ??, ??, ?????? ?? ?? ?? ??? ? ?? ?? ? ????."
          sectionTone="border-sky-200 bg-sky-50/70"
          accentClass="border-sky-500 bg-sky-100"
          buttonClass="bg-sky-600 hover:bg-sky-700"
          items={selectableSchoolCategories.map((category) => ({ key: category.key, title: category.name, subtitle: "?? ?? ??" }))}
          selectedKeys={schoolSelection.selectedCategories}
          onToggle={schoolSelection.toggleCategory}
          onSelectAll={schoolSelection.selectAllCategories}
          onClear={schoolSelection.clearCategories}
        />

        <SelectionSection
          title="??? ??"
          description="?? ?? ??? ??? ?? ??? ? ????."
          sectionTone="border-emerald-200 bg-emerald-50/70"
          accentClass="border-emerald-500 bg-emerald-100"
          buttonClass="bg-emerald-600 hover:bg-emerald-700"
          items={selectableColleges.map((college) => ({ key: college.key, title: college.name, subtitle: "??? ??" }))}
          selectedKeys={collegeSelection.selectedCategories}
          onToggle={collegeSelection.toggleCategory}
          onSelectAll={collegeSelection.selectAllCategories}
          onClear={collegeSelection.clearCategories}
        />

        <SelectionSection
          title="?? ??"
          description="??????, ???, ?????, ???, ???????? ?? ??? ??? ?? ?????."
          sectionTone="border-amber-200 bg-amber-50/75"
          accentClass="border-amber-500 bg-amber-100"
          buttonClass="bg-amber-500 hover:bg-amber-600"
          items={institutionCenters.map((center) => ({ key: center.key, title: center.name, subtitle: center.category }))}
          selectedKeys={centerSelection.selectedCategories}
          onToggle={centerSelection.toggleCategory}
          onSelectAll={() => selectCenterGroup(institutionCenters.map((center) => center.key))}
          onClear={() => clearCenterGroup(institutionCenters.map((center) => center.key))}
        />

        <SelectionSection
          title="??? ??"
          description="?????, ????, ?????, ????, ???, ????? ?? ??? ??? ?? ?????."
          sectionTone="border-orange-200 bg-orange-50/75"
          accentClass="border-orange-500 bg-orange-100"
          buttonClass="bg-orange-500 hover:bg-orange-600"
          items={projectCenters.map((center) => ({ key: center.key, title: center.name, subtitle: center.category }))}
          selectedKeys={centerSelection.selectedCategories}
          onToggle={centerSelection.toggleCategory}
          onSelectAll={() => selectCenterGroup(projectCenters.map((center) => center.key))}
          onClear={() => clearCenterGroup(projectCenters.map((center) => center.key))}
        />
      </div>

      <DepartmentSelectionSection
        selectedKeys={departmentSelection.selectedCategories}
        onToggle={departmentSelection.toggleCategory}
        onSelectAll={departmentSelection.selectAllCategories}
        onClear={departmentSelection.clearCategories}
      />
    </div>
  );
}
