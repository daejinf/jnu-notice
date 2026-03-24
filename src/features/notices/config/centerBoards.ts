import type { NoticeSourceType } from "@/types/notice";

export type CenterBoardEngine =
  | "subview"
  | "xboard"
  | "sojoong-education"
  | "sojoong-notice"
  | "coss-notice"
  | "juice-main"
  | "aspnet-board"
  | "grow-notice"
  | "ile-notice"
  | "library-bbs"
  | "capd-program"
  | "capd-home-section";

export type CenterBoardConfig = {
  key: string;
  name: string;
  listUrl: string;
  sourceType: NoticeSourceType;
  sourceName: string;
  category: string;
  enabled: boolean;
  engine: CenterBoardEngine;
  maxPages: number;
};

function createCenterConfig(
  key: string,
  name: string,
  listUrl: string,
  options: {
    engine?: CenterBoardEngine;
    category?: string;
    maxPages?: number;
  } = {},
): CenterBoardConfig {
  return {
    key,
    name,
    listUrl,
    sourceType: "center",
    sourceName: name,
    category: options.category ?? "기관 공지",
    enabled: true,
    engine: options.engine ?? "subview",
    maxPages: options.maxPages ?? 5,
  };
}

export const centerBoardConfigs: CenterBoardConfig[] = [
  createCenterConfig(
    "greenbio",
    "그린바이오혁신융합대학사업단",
    "https://greenbio.jnu.ac.kr/greenbio/20997/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZ3JlZW5iaW8lMkYzNDY3JTJGYXJ0Y2xMaXN0LmRvJTNG",
    { category: "사업단 공지" },
  ),
  createCenterConfig(
    "battery",
    "이차전지특성화대학사업단",
    "https://battery.jnu.ac.kr/battery/20415/subview.do",
    { category: "사업단 공지" },
  ),
  createCenterConfig(
    "sw-core",
    "소프트웨어중심사업단",
    "https://sojoong.kr/notice/notice-board/",
    { engine: "sojoong-notice", maxPages: 10, category: "사업단 공지" },
  ),
  createCenterConfig(
    "sw-core-education",
    "소프트웨어중심사업단 교육신청",
    "https://sojoong.kr/join/education/",
    { engine: "sojoong-education", category: "교육신청", maxPages: 10 },
  ),
  createCenterConfig(
    "aicoss",
    "인공지능혁신융합대학사업단",
    "https://www.aicoss.kr/www/notice/?cate=%EC%A0%84%EB%82%A8%EB%8C%80%ED%95%99%EA%B5%90",
    { engine: "coss-notice", maxPages: 5, category: "사업단 공지" },
  ),
  createCenterConfig(
    "juice-semi",
    "반도체특성화대학사업단",
    "https://www.juice-semi.kr/jnu/main/?menu=63",
    { engine: "juice-main", maxPages: 1, category: "사업단 공지" },
  ),
  createCenterConfig(
    "nccoss",
    "차세대통신혁신융합대학사업단",
    "https://jnu.nccoss.kr/www/notice/",
    { engine: "coss-notice", maxPages: 5, category: "사업단 공지" },
  ),
  createCenterConfig(
    "grow-maru",
    "비교과 통합 플랫폼 성장마루",
    "https://grow.jnu.ac.kr/ko/program/intro/list/0/1",
    { engine: "grow-notice", maxPages: 5, category: "Program" },
  ),
  createCenterConfig(
    "capd-notice",
    "취업진로포털 공지사항",
    "https://capd.jnu.ac.kr/",
    { engine: "capd-home-section", maxPages: 1, category: "기관 공지" },
  ),
  createCenterConfig(
    "capd-program",
    "취업진로포털 취업프로그램",
    "https://capd.jnu.ac.kr/",
    { engine: "capd-home-section", maxPages: 1, category: "취업프로그램" },
  ),
  createCenterConfig(
    "capd-job-fair",
    "취업진로포털 채용설명회",
    "https://capd.jnu.ac.kr/",
    { engine: "capd-home-section", maxPages: 1, category: "채용설명회" },
  ),
  createCenterConfig(
    "capd-recommend",
    "취업진로포털 추천채용",
    "https://capd.jnu.ac.kr/",
    { engine: "capd-home-section", maxPages: 1, category: "추천채용" },
  ),
  createCenterConfig(
    "ile",
    "교육혁신본부",
    "https://ile.jnu.ac.kr/ko/community/notice",
    { engine: "ile-notice", maxPages: 5, category: "기관 공지" },
  ),
  createCenterConfig(
    "lec",
    "언어교육원",
    "https://lec.jnu.ac.kr/Board/Board.aspx?BoardID=1",
    { engine: "aspnet-board", maxPages: 5, category: "기관 공지" },
  ),
  createCenterConfig(
    "library",
    "도서관",
    "https://lib.jnu.ac.kr/bbs/list/1",
    { engine: "library-bbs", maxPages: 5, category: "기관 공지" },
  ),
  createCenterConfig(
    "international",
    "국제협력과",
    "https://international.jnu.ac.kr/Board/Notice.aspx",
    { engine: "aspnet-board", maxPages: 5, category: "기관 공지" },
  ),
  createCenterConfig(
    "dormitory",
    "광주생활관",
    "https://dormitory.jnu.ac.kr/Board/Board.aspx?BoardID=1",
    { engine: "aspnet-board", maxPages: 5, category: "기관 공지" },
  ),
  createCenterConfig(
    "hwasun-dormitory",
    "화순생활관",
    "https://hsdorm.jnu.ac.kr/Board/Board.aspx?BoardID=50",
    { engine: "aspnet-board", maxPages: 5, category: "기관 공지" },
  ),
  createCenterConfig(
    "yeosu-dormitory",
    "여수생활관",
    "https://house.jnu.ac.kr/Board/Board.aspx?BoardID=29",
    { engine: "aspnet-board", maxPages: 5, category: "기관 공지" },
  ),
];

export const enabledCenterBoardConfigs = centerBoardConfigs.filter((center) => center.enabled);