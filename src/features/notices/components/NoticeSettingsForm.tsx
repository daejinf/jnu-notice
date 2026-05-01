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

const TEXT = {
  selectAll: "\uC804\uCCB4 \uC120\uD0DD",
  clear: "\uC120\uD0DD \uD574\uC81C",
  settingsBadge: "\uC18C\uC2A4\uAD00\uB9AC",
  settingsTitle: "\uBC1B\uC744 \uACF5\uC9C0 \uC18C\uC2A4\uAD00\uB9AC",
  settingsDescription: "\uC18C\uC2A4\uB9CC \uCF1C\uB450\uBA74 \uD53C\uB4DC, \uB7AD\uD0B9, \uB9DE\uCDA4\uC5D0 \uBC14\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4.",
  hydrating: "\uBD88\uB7EC\uC624\uB294 \uC911",
  synced: "\uACC4\uC815\uC5D0 \uC800\uC7A5\uB428",
  fetchError: "\uC124\uC815 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  saving: "\uC800\uC7A5\uD558\uB294 \uC911",
  saveError: "\uC124\uC815 \uC815\uBCF4\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  saveDone: "\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  schoolTitle: "\uBCF8\uBD80",
  schoolDescription: "\uD559\uC0AC, \uC7A5\uD559, \uCDE8\uC5C5, \uD559\uC0DD\uC9C0\uC6D0\uCC98\uB7FC \uD559\uAD50 \uC804\uCCB4 \uB2E8\uC704 \uACF5\uC9C0\uB97C \uD55C \uBC88\uC5D0 \uACE0\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  schoolSubtitle: "\uD559\uAD50 \uBCF8\uBD80 \uACF5\uC9C0",
  collegeTitle: "\uB2E8\uACFC\uB300",
  collegeDescription: "\uAD00\uC2EC \uC788\uB294 \uB2E8\uACFC\uB300 \uACF5\uC9C0\uB9CC \uB530\uB85C \uBC1B\uC544\uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  collegeSubtitle: "\uB2E8\uACFC\uB300 \uACF5\uC9C0",
  centerTitle: "\uAE30\uAD00",
  centerDescription: "\uAD50\uC721\uD601\uC2E0\uBCF8\uBD80, \uB3C4\uC11C\uAD00, \uAD6D\uC81C\uD611\uB825\uACFC, \uC0DD\uD65C\uAD00, \uCDE8\uC5C5\uC9C4\uB85C\uD3EC\uD138\uCC98\uB7FC \uAE30\uAD00 \uC131\uACA9\uC758 \uACF5\uC9C0\uB97C \uB530\uB85C \uBB36\uC5C8\uC2B5\uB2C8\uB2E4.",
  projectTitle: "\uC0AC\uC5C5\uB2E8",
  projectDescription: "\uADF8\uB9B0\uBC14\uC774\uC624, \uC774\uCC28\uC804\uC9C0, \uC18C\uD504\uD2B8\uC6E8\uC5B4, \uC778\uACF5\uC9C0\uB2A5, \uBC18\uB3C4\uCCB4, \uCC28\uC138\uB300\uD1B5\uC2E0 \uAC19\uC740 \uC0AC\uC5C5\uB2E8 \uACF5\uC9C0\uB97C \uB530\uB85C \uAD00\uB9AC\uD569\uB2C8\uB2E4.",
  departmentTitle: "\uD559\uACFC",
  departmentDescription: "\uD559\uACFC\uBA85\uC744 \uAC80\uC0C9\uD574\uC11C \uBE60\uB974\uAC8C \uCC3E\uACE0, \uB2E8\uACFC\uB300 \uC544\uB798\uC5D0\uC11C \uC6D0\uD558\uB294 \uD559\uACFC\uB9CC \uC138\uBC00\uD558\uAC8C \uACE0\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  departmentSearch: "\uD559\uACFC \uAC80\uC0C9",
  departmentSearchPlaceholder: "\uC608: \uACBD\uC601\uD559\uACFC, \uC804\uC790\uACF5\uD559\uACFC, \uC778\uACF5\uC9C0\uB2A5\uD559\uBD80",
  departmentCountSuffix: "\uAC1C \uD559\uACFC",
  departmentEmpty: "\uAC80\uC0C9 \uACB0\uACFC\uC5D0 \uB9DE\uB294 \uD559\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
};

type NoticePreferencesResponse = { preferences: NoticePreferences | null; error?: string };

function SelectionSection({ title, description, sectionTone, accentClass, buttonClass, items, selectedKeys, onToggle, onSelectAll, onClear }: { title: string; description: string; sectionTone: string; accentClass: string; buttonClass: string; items: Array<{ key: string; title: string; subtitle: string }>; selectedKeys: string[]; onToggle: (key: string) => void; onSelectAll: () => void; onClear: () => void; }) {
  return <section className={`rounded-[32px] border p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] sm:p-6 ${sectionTone}`}><div className="flex flex-col gap-4 border-b border-black/5 pb-4"><div><h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onSelectAll} className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${buttonClass}`}>{TEXT.selectAll}</button><button type="button" onClick={onClear} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{TEXT.clear}</button></div></div><div className="mt-4 grid gap-3">{items.map((item) => { const checked = selectedKeys.includes(item.key); return <label key={item.key} className={`flex cursor-pointer items-start gap-3 rounded-[24px] border px-4 py-4 transition shadow-[0_6px_16px_rgba(15,23,42,0.03)] ${checked ? accentClass : "border-slate-200 bg-white/88 hover:bg-white"}`}><input type="checkbox" checked={checked} onChange={() => onToggle(item.key)} className="mt-1 h-4 w-4" /><div><p className="font-bold text-slate-950">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.subtitle}</p></div></label>; })}</div></section>;
}

function DepartmentSelectionSection({ selectedKeys, onToggle, onSelectAll, onClear }: { selectedKeys: string[]; onToggle: (key: string) => void; onSelectAll: () => void; onClear: () => void; }) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const filteredGroups = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const groupedMap = new Map<string, typeof selectableDepartments>();
    selectableDepartments.forEach((department) => {
      const matchesKeyword = keyword.length === 0 || department.college.toLowerCase().includes(keyword) || department.department.toLowerCase().includes(keyword);
      if (!matchesKeyword) return;
      const currentGroup = groupedMap.get(department.college) ?? [];
      currentGroup.push(department);
      groupedMap.set(department.college, currentGroup);
    });
    return Array.from(groupedMap.entries()).map(([college, departments]) => ({ college, departments }));
  }, [searchKeyword]);

  return <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] sm:p-6"><div className="flex flex-col gap-4 border-b border-violet-200/70 pb-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-xl font-bold tracking-tight text-slate-950">{TEXT.departmentTitle}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{TEXT.departmentDescription}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onSelectAll} className="rounded-2xl bg-[#3182F6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B64DA]">{TEXT.selectAll}</button><button type="button" onClick={onClear} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{TEXT.clear}</button></div></div><div className="mt-5"><label className="text-sm font-semibold text-violet-800">{TEXT.departmentSearch}</label><input type="text" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder={TEXT.departmentSearchPlaceholder} className="mt-2 h-13 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#3182F6]" /></div><div className="mt-5 grid gap-4 xl:grid-cols-2">{filteredGroups.map((group) => <div key={group.college} className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-4"><div className="border-b border-violet-100 pb-3"><p className="text-base font-bold text-slate-950">{group.college}</p><p className="mt-1 text-xs font-medium text-slate-500">{`${group.departments.length}${TEXT.departmentCountSuffix}`}</p></div><div className="mt-4 grid gap-2">{group.departments.map((department) => { const checked = selectedKeys.includes(department.key); return <label key={department.key} className={`flex cursor-pointer items-start gap-3 rounded-[22px] border px-4 py-3.5 transition ${checked ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><input type="checkbox" checked={checked} onChange={() => onToggle(department.key)} className="mt-1 h-4 w-4" /><div><p className="font-semibold text-slate-950">{department.department}</p><p className="mt-1 text-sm text-slate-500">{group.college}</p></div></label>; })}</div></div>)}</div>{filteredGroups.length === 0 ? <div className="mt-5 rounded-3xl border border-dashed border-violet-300 bg-white/80 px-4 py-14 text-center text-sm text-slate-500">{TEXT.departmentEmpty}</div> : null}</section>;
}

export function NoticeSettingsForm({ storageScope }: { storageScope: string }) {
  const schoolSelection = useSelectedCategories(selectableSchoolCategoryKeys, { storageKey: buildScopedStorageKey(SCHOOL_STORAGE_KEY, storageScope) });
  const collegeSelection = useSelectedCategories(selectableCollegeKeys, { storageKey: buildScopedStorageKey(COLLEGE_STORAGE_KEY, storageScope) });
  const departmentSelection = useSelectedCategories(selectableDepartmentKeys, { storageKey: buildScopedStorageKey(DEPARTMENT_STORAGE_KEY, storageScope) });
  const centerSelection = useSelectedCategories(selectableCenterKeys, { storageKey: buildScopedStorageKey(CENTER_STORAGE_KEY, storageScope) });
  const [isHydratingServer, setIsHydratingServer] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const hasFetchedServerPreferences = useRef(false);
  const isReady = schoolSelection.isReady && collegeSelection.isReady && departmentSelection.isReady && centerSelection.isReady;
  const institutionCenters = useMemo(() => selectableCenters.filter((center) => !PROJECT_CENTER_KEYS.includes(center.key)), []);
  const projectCenters = useMemo(() => selectableCenters.filter((center) => PROJECT_CENTER_KEYS.includes(center.key)), []);

  useEffect(() => {
    if (!isReady || hasFetchedServerPreferences.current) return;
    const controller = new AbortController();
    hasFetchedServerPreferences.current = true;
    const run = async () => {
      try {
        const response = await fetch("/api/notice-preferences", { signal: controller.signal, cache: "no-store" });
        const data = (await response.json()) as NoticePreferencesResponse;
        if (!response.ok) throw new Error(data.error ?? TEXT.fetchError);
        if (data.preferences) {
          schoolSelection.setSelectedCategories(data.preferences.schoolCategoryKeys.filter((value) => selectableSchoolCategoryKeys.includes(value)));
          collegeSelection.setSelectedCategories(data.preferences.collegeKeys.filter((value) => selectableCollegeKeys.includes(value)));
          departmentSelection.setSelectedCategories(data.preferences.departmentKeys.filter((value) => selectableDepartmentKeys.includes(value)));
          centerSelection.setSelectedCategories(data.preferences.centerKeys.filter((value) => selectableCenterKeys.includes(value)));
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setSyncStatus("error");
        setSyncMessage(error instanceof Error ? error.message : TEXT.fetchError);
      } finally {
        setIsHydratingServer(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [centerSelection, centerSelection.setSelectedCategories, collegeSelection, collegeSelection.setSelectedCategories, departmentSelection, departmentSelection.setSelectedCategories, isReady, schoolSelection, schoolSelection.setSelectedCategories]);

  useEffect(() => {
    if (!isReady || isHydratingServer) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSyncStatus("saving");
        setSyncMessage(TEXT.saving);
        const response = await fetch("/api/notice-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schoolCategoryKeys: schoolSelection.selectedCategories, collegeKeys: collegeSelection.selectedCategories, departmentKeys: departmentSelection.selectedCategories, centerKeys: centerSelection.selectedCategories }), signal: controller.signal });
        const data = (await response.json()) as NoticePreferencesResponse;
        if (!response.ok) throw new Error(data.error ?? TEXT.saveError);
        setSyncStatus("saved");
        setSyncMessage(TEXT.saveDone);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setSyncStatus("error");
        setSyncMessage(error instanceof Error ? error.message : TEXT.saveError);
      }
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [centerSelection.selectedCategories, collegeSelection.selectedCategories, departmentSelection.selectedCategories, isHydratingServer, isReady, schoolSelection.selectedCategories]);

  function selectCenterGroup(keys: string[]) { centerSelection.setSelectedCategories((current: string[]) => Array.from(new Set([...current, ...keys]))); }
  function clearCenterGroup(keys: string[]) { centerSelection.setSelectedCategories((current: string[]) => current.filter((key: string) => !keys.includes(key))); }

  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"><section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7"><span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{TEXT.settingsBadge}</span><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{TEXT.settingsTitle}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{TEXT.settingsDescription}</p><div className="mt-4 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700">{isHydratingServer ? TEXT.hydrating : TEXT.synced}</span>{syncMessage ? <span className={`rounded-full px-4 py-2 font-semibold ${syncStatus === "error" ? "bg-rose-100 text-rose-700" : syncStatus === "saved" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>{syncMessage}</span> : null}</div></section><div className="grid gap-5 xl:grid-cols-2"><SelectionSection title={TEXT.schoolTitle} description={TEXT.schoolDescription} sectionTone="border-sky-200 bg-sky-50/70" accentClass="border-sky-500 bg-sky-100" buttonClass="bg-sky-600 hover:bg-sky-700" items={selectableSchoolCategories.map((category) => ({ key: category.key, title: category.name, subtitle: TEXT.schoolSubtitle }))} selectedKeys={schoolSelection.selectedCategories} onToggle={schoolSelection.toggleCategory} onSelectAll={schoolSelection.selectAllCategories} onClear={schoolSelection.clearCategories} /><SelectionSection title={TEXT.collegeTitle} description={TEXT.collegeDescription} sectionTone="border-emerald-200 bg-emerald-50/70" accentClass="border-emerald-500 bg-emerald-100" buttonClass="bg-emerald-600 hover:bg-emerald-700" items={selectableColleges.map((college) => ({ key: college.key, title: college.name, subtitle: TEXT.collegeSubtitle }))} selectedKeys={collegeSelection.selectedCategories} onToggle={collegeSelection.toggleCategory} onSelectAll={collegeSelection.selectAllCategories} onClear={collegeSelection.clearCategories} /><SelectionSection title={TEXT.centerTitle} description={TEXT.centerDescription} sectionTone="border-amber-200 bg-amber-50/75" accentClass="border-amber-500 bg-amber-100" buttonClass="bg-amber-500 hover:bg-amber-600" items={institutionCenters.map((center) => ({ key: center.key, title: center.name, subtitle: center.category }))} selectedKeys={centerSelection.selectedCategories} onToggle={centerSelection.toggleCategory} onSelectAll={() => selectCenterGroup(institutionCenters.map((center) => center.key))} onClear={() => clearCenterGroup(institutionCenters.map((center) => center.key))} /><SelectionSection title={TEXT.projectTitle} description={TEXT.projectDescription} sectionTone="border-orange-200 bg-orange-50/75" accentClass="border-orange-500 bg-orange-100" buttonClass="bg-orange-500 hover:bg-orange-600" items={projectCenters.map((center) => ({ key: center.key, title: center.name, subtitle: center.category }))} selectedKeys={centerSelection.selectedCategories} onToggle={centerSelection.toggleCategory} onSelectAll={() => selectCenterGroup(projectCenters.map((center) => center.key))} onClear={() => clearCenterGroup(projectCenters.map((center) => center.key))} /></div><DepartmentSelectionSection selectedKeys={departmentSelection.selectedCategories} onToggle={departmentSelection.toggleCategory} onSelectAll={departmentSelection.selectAllCategories} onClear={departmentSelection.clearCategories} /></div>;
}


