"use client";

import { useMemo, useState } from "react";
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

const PROJECT_CENTER_KEYS = ["greenbio", "battery", "sw-core", "sw-core-education", "aicoss", "juice-semi", "nccoss"];

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
            전체 선택
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            선택 해제
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
          <h2 className="text-xl font-bold tracking-tight text-slate-950">학과 알림</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            학과명을 검색해서 빠르게 찾고, 단과대 아래에서 원하는 학과만 세밀하게 고를 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSelectAll} className="rounded-2xl bg-[#3182F6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B64DA]">
            전체 선택
          </button>
          <button type="button" onClick={onClear} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            선택 해제
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label className="text-sm font-semibold text-violet-800">학과 검색</label>
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="예: 경영학과, 전자공학과, 인공지능학부"
          className="mt-2 h-13 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#3182F6]"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {filteredGroups.map((group) => (
          <div key={group.college} className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-4">
            <div className="border-b border-violet-100 pb-3">
              <p className="text-base font-bold text-slate-950">{group.college}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{group.departments.length}개 학과</p>
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
          검색 결과에 맞는 학과가 없습니다.
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

  const institutionCenters = useMemo(() => selectableCenters.filter((center) => !PROJECT_CENTER_KEYS.includes(center.key)), []);
  const projectCenters = useMemo(() => selectableCenters.filter((center) => PROJECT_CENTER_KEYS.includes(center.key)), []);

  function selectCenterGroup(keys: string[]) {
    centerSelection.setSelectedCategories((current: string[]) => Array.from(new Set([...current, ...keys])));
  }

  function clearCenterGroup(keys: string[]) {
    centerSelection.setSelectedCategories((current: string[]) => current.filter((key: string) => !keys.includes(key)));
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">공지 설정</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">보고 싶은 공지만 골라두세요</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          학교 본부, 단과대, 학과, 기관 공지, 사업단 알림 중에서 나한테 필요한 것만 고를 수 있습니다.
          묶음별 색을 다르게 나눠서 한눈에 구분되도록 정리했습니다.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SelectionSection
          title="본부 알림"
          description="학사, 장학, 취업, 학생지원처럼 학교 전체 단위 공지를 한 번에 고를 수 있습니다."
          sectionTone="border-sky-200 bg-sky-50/70"
          accentClass="border-sky-500 bg-sky-100"
          buttonClass="bg-sky-600 hover:bg-sky-700"
          items={selectableSchoolCategories.map((category) => ({ key: category.key, title: category.name, subtitle: "학교 본부 공지" }))}
          selectedKeys={schoolSelection.selectedCategories}
          onToggle={schoolSelection.toggleCategory}
          onSelectAll={schoolSelection.selectAllCategories}
          onClear={schoolSelection.clearCategories}
        />

        <SelectionSection
          title="단과대 알림"
          description="관심 있는 단과대 공지만 따로 받아볼 수 있습니다."
          sectionTone="border-emerald-200 bg-emerald-50/70"
          accentClass="border-emerald-500 bg-emerald-100"
          buttonClass="bg-emerald-600 hover:bg-emerald-700"
          items={selectableColleges.map((college) => ({ key: college.key, title: college.name, subtitle: "단과대 공지" }))}
          selectedKeys={collegeSelection.selectedCategories}
          onToggle={collegeSelection.toggleCategory}
          onSelectAll={collegeSelection.selectAllCategories}
          onClear={collegeSelection.clearCategories}
        />

        <SelectionSection
          title="기관 알림"
          description="교육혁신본부, 도서관, 국제협력과, 생활관, 취업진로포털처럼 기관 성격의 공지를 따로 묶었습니다."
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
          title="사업단 알림"
          description="그린바이오, 이차전지, 소프트웨어, 인공지능, 반도체, 차세대통신 같은 사업단 공지를 따로 관리합니다."
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