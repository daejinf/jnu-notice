import type { NoticeSourceType } from "@/types/notice";

export type SchoolBoardCategory = {
  key: string;
  name: string;
  cate: string;
  sourceType: NoticeSourceType;
  sourceName: string;
};

export const schoolBoardAllCategory: SchoolBoardCategory = {
  key: "all",
  name: "전체 카테고리",
  cate: "0",
  sourceType: "school",
  sourceName: "전남대학교 본부",
};

export const schoolBoardCategories: SchoolBoardCategory[] = [
  {
    key: "academic",
    name: "학사안내",
    cate: "5",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "campusLife",
    name: "대학생활",
    cate: "6",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "employment",
    name: "취업정보",
    cate: "7",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "scholarship",
    name: "장학안내",
    cate: "8",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "event",
    name: "행사안내",
    cate: "9",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "military",
    name: "병무안내",
    cate: "10",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "construction",
    name: "공사안내",
    cate: "11",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "bid",
    name: "입찰공고",
    cate: "12",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "recruitment",
    name: "채용공고",
    cate: "13",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "itNews",
    name: "IT뉴스",
    cate: "14",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "contest",
    name: "공모전",
    cate: "15",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "application",
    name: "모집공고",
    cate: "16",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "research",
    name: "학술연구",
    cate: "17",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "staffAward",
    name: "직원표창공개",
    cate: "842",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
  {
    key: "administrative",
    name: "행정공고",
    cate: "1367",
    sourceType: "school",
    sourceName: "전남대학교 본부",
  },
];

export const schoolCategoryKeys = schoolBoardCategories.map((category) => category.key);
