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
  accentClass: string;
  buttonClass: string;
  items: Array<{ key: string; title: string; subtitle: string }>;
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold text-white ${buttonClass}`}
        >
          전체 선택
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-300"
        >
          선택 해제
        </button>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => {
          const checked = selectedKeys.includes(item.key);

          return (
            <label
              key={item.key}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 ${checked ? accentClass : "border-slate-200 bg-slate-50"}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.key)}
                className="h-4 w-4"
              />
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="text-sm text-slate-600">{item.subtitle}</p>
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

      if (!matchesKeyword) {
        return;
      }

      const currentGroup = groupedMap.get(department.college) ?? [];
      currentGroup.push(department);
      groupedMap.set(department.college, currentGroup);
    });

    return Array.from(groupedMap.entries()).map(([college, departments]) => ({
      college,
      departments,
    }));
  }, [searchKeyword]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">학과 알림</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            학과를 검색해서 빠르게 찾고, 단과대 아래에서 선택할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded-full bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            전체 선택
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-300"
          >
            선택 해제
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-slate-800">학과 검색</label>
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="예: 간호학과, 소프트웨어공학과, 경영학부"
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {filteredGroups.map((group) => (
          <div key={group.college} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="border-b border-slate-200 pb-2">
              <p className="text-base font-bold text-slate-950">{group.college}</p>
              <p className="mt-1 text-xs text-slate-600">{group.departments.length}개 학과</p>
            </div>
            <div className="mt-3 grid gap-2">
              {group.departments.map((department) => {
                const checked = selectedKeys.includes(department.key);

                return (
                  <label
                    key={department.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 ${checked ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(department.key)}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-semibold text-slate-950">{department.department}</p>
                      <p className="text-sm text-slate-600">{group.college}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          검색 결과에 맞는 학과가 없습니다.
        </div>
      ) : null}
    </section>
  );
}

export function NoticeSettingsForm() {
  const schoolSelection = useSelectedCategories(selectableSchoolCategoryKeys, {
    storageKey: SCHOOL_STORAGE_KEY,
  });
  const collegeSelection = useSelectedCategories(selectableCollegeKeys, {
    storageKey: COLLEGE_STORAGE_KEY,
  });
  const departmentSelection = useSelectedCategories(selectableDepartmentKeys, {
    storageKey: DEPARTMENT_STORAGE_KEY,
  });
  const centerSelection = useSelectedCategories(selectableCenterKeys, {
    storageKey: CENTER_STORAGE_KEY,
  });

  const institutionCenters = useMemo(
    () => selectableCenters.filter((center) => !PROJECT_CENTER_KEYS.includes(center.key)),
    [],
  );
  const partnerCenters = useMemo(
    () => selectableCenters.filter((center) => PROJECT_CENTER_KEYS.includes(center.key)),
    [],
  );

  function selectCenterGroup(keys: string[]) {
    centerSelection.setSelectedCategories((current: string[]) =>
      Array.from(new Set([...current, ...keys])),
    );
  }

  function clearCenterGroup(keys: string[]) {
    centerSelection.setSelectedCategories((current: string[]) =>
      current.filter((key: string) => !keys.includes(key)),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-sky-600 p-5 text-white shadow-lg sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Settings</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">내 공지 설정</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">
          학교 본부, 단과대, 학과, 기관 공지, 사업단 알림 중에서 내가 보고 싶은 공지만 골라 저장할 수 있습니다.
          설정은 브라우저에 남아서 다음에 다시 열어도 그대로 유지됩니다.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SelectionSection
          title="학교 본부 알림"
          description="학사안내, 장학안내, 취업정보 같은 대표 공지를 고릅니다."
          accentClass="border-sky-500 bg-sky-50"
          buttonClass="bg-sky-600 hover:bg-sky-700"
          items={selectableSchoolCategories.map((category) => ({
            key: category.key,
            title: category.name,
            subtitle: "대표 공지",
          }))}
          selectedKeys={schoolSelection.selectedCategories}
          onToggle={schoolSelection.toggleCategory}
          onSelectAll={schoolSelection.selectAllCategories}
          onClear={schoolSelection.clearCategories}
        />

        <SelectionSection
          title="단과대 알림"
          description="원하는 단과대 공지사항만 따로 선택할 수 있습니다."
          accentClass="border-emerald-500 bg-emerald-50"
          buttonClass="bg-emerald-600 hover:bg-emerald-700"
          items={selectableColleges.map((college) => ({
            key: college.key,
            title: college.name,
            subtitle: "단과대 공지",
          }))}
          selectedKeys={collegeSelection.selectedCategories}
          onToggle={collegeSelection.toggleCategory}
          onSelectAll={collegeSelection.selectAllCategories}
          onClear={collegeSelection.clearCategories}
        />

        <SelectionSection
          title="기관 공지"
          description="교육혁신본부, 도서관, 국제협력과 같은 기관 공지를 따로 모아 선택합니다."
          accentClass="border-amber-500 bg-amber-50"
          buttonClass="bg-amber-500 hover:bg-amber-600"
          items={institutionCenters.map((center) => ({
            key: center.key,
            title: center.name,
            subtitle: center.category,
          }))}
          selectedKeys={centerSelection.selectedCategories}
          onToggle={centerSelection.toggleCategory}
          onSelectAll={() => selectCenterGroup(institutionCenters.map((center) => center.key))}
          onClear={() => clearCenterGroup(institutionCenters.map((center) => center.key))}
        />

        <SelectionSection
          title="사업단 알림"
          description="그린바이오, 이차전지, 소프트웨어, 인공지능, 반도체, 차세대통신 사업단만 따로 선택합니다."
          accentClass="border-orange-500 bg-orange-50"
          buttonClass="bg-orange-500 hover:bg-orange-600"
          items={partnerCenters.map((center) => ({
            key: center.key,
            title: center.name,
            subtitle: center.category,
          }))}
          selectedKeys={centerSelection.selectedCategories}
          onToggle={centerSelection.toggleCategory}
          onSelectAll={() => selectCenterGroup(partnerCenters.map((center) => center.key))}
          onClear={() => clearCenterGroup(partnerCenters.map((center) => center.key))}
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
