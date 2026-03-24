import type { NoticeSourceType } from "@/types/notice";

export type CollegeBoardEngine = "subview" | "xboard";

export type CollegeBoardConfig = {
  key: string;
  name: string;
  listUrl: string;
  sourceType: NoticeSourceType;
  sourceName: string;
  category: string;
  enabled: boolean;
  engine: CollegeBoardEngine;
  maxPages: number;
};

function createCollegeConfig(
  key: string,
  name: string,
  listUrl: string,
  engine: CollegeBoardEngine = "subview",
): CollegeBoardConfig {
  return {
    key,
    name,
    listUrl,
    sourceType: "college",
    sourceName: name,
    category: "공지사항",
    enabled: true,
    engine,
    maxPages: 5,
  };
}

export const collegeBoardConfigs: CollegeBoardConfig[] = [
  createCollegeConfig("nursing", "간호대학", "https://nursing.jnu.ac.kr/nursing/5656/subview.do"),
  createCollegeConfig("business", "경영대학", "https://cba.jnu.ac.kr/cba/13919/subview.do"),
  createCollegeConfig("engineering", "공과대학", "https://eng.jnu.ac.kr/eng/7343/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZW5nJTJGOTkzJTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createCollegeConfig("agriculture", "농업생명과학대학", "https://agric.jnu.ac.kr/agric/4638/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYWdyaWMlMkY0MjAlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createCollegeConfig("education", "사범대학", "https://education.jnu.ac.kr/education/15284/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWR1Y2F0aW9uJTJGMjI3NSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createCollegeConfig("socialSciences", "사회과학대학", "https://socsci.jnu.ac.kr/socsci/8806/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGc29jc2NpJTJGMTA0NCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createCollegeConfig("humanEcology", "생활과학대학", "https://humanecology.jnu.ac.kr/humanecology/12765/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaHVtYW5lY29sb2d5JTJGMTg3MCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createCollegeConfig("veterinary", "수의과대학", "https://vetmed.jnu.ac.kr/vetmed/12818/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGdmV0bWVkJTJGMTg3NCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createCollegeConfig("pharmacy", "약학대학", "https://pharmacy.jnu.ac.kr/pharmacy/7190/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcGhhcm1hY3klMkY5NzUlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createCollegeConfig("arts", "예술대학", "https://arts.jnu.ac.kr/arts/12862/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYXJ0cyUyRjIyMTUlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createCollegeConfig("medicine", "의과대학", "https://medicine.jnu.ac.kr/xboard/board.php?tbnum=21", "xboard"),
  createCollegeConfig("humanities", "인문대학", "https://human.jnu.ac.kr/human/15014/subview.do"),
  createCollegeConfig("naturalSciences", "자연과학대학", "https://natural.jnu.ac.kr/natural/14487/subview.do"),
  createCollegeConfig("aiConvergence", "AI융합대학", "https://cvg.jnu.ac.kr/cvg/3608/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY3ZnJTJGNDA1JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createCollegeConfig("openMajor", "자율전공학부", "http://sdis.jnu.ac.kr/sdis/1950/subview.do"),
  createCollegeConfig("engineeringYeosu", "공학대학(여수)", "https://engc.jnu.ac.kr/engc/2167/subview.do"),
  createCollegeConfig("cultureYeosu", "문화사회과학대학(여수)", "https://yculture.jnu.ac.kr/yculture/17318/subview.do"),
  createCollegeConfig("marineYeosu", "수산해양대학(여수)", "https://sea.jnu.ac.kr/sea/3465/subview.do"),
  createCollegeConfig("creativeYeosu", "창의융합학부(여수)", "https://fcc.jnu.ac.kr/fcc/18180/subview.do"),
];

export const enabledCollegeBoardConfigs = collegeBoardConfigs.filter((college) => college.enabled);
