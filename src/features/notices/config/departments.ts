import type { DepartmentParserType } from "@/types/notice";

export type DepartmentConfig = {
  key: string;
  college: string;
  department: string;
  siteUrl: string;
  noticeUrl: string;
  parserType: DepartmentParserType;
  enabled: boolean;
  maxPages: number;
};

function createDepartmentConfig(
  key: string,
  college: string,
  department: string,
  siteUrl: string,
  noticeUrl: string,
  parserType: DepartmentParserType = "subview-bbs",
): DepartmentConfig {
  return {
    key,
    college,
    department,
    siteUrl,
    noticeUrl,
    parserType,
    enabled: true,
    maxPages: 5,
  };
}

export const departmentConfigs: DepartmentConfig[] = [
  createDepartmentConfig("nursing", "간호대학", "간호학과", "https://nursing.jnu.ac.kr/nursing/5656/subview.do", "https://nursing.jnu.ac.kr/nursing/5656/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbnVyc2luZyUyRjU1MyUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),

  createDepartmentConfig("business-admin", "경영대학", "경영학부", "https://biz.jnu.ac.kr/biz/12212/subview.do", "https://biz.jnu.ac.kr/biz/12212/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYml6JTJGMjI0NSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("economics", "경영대학", "경제학부", "https://eco.jnu.ac.kr/eco/12253/subview.do", "https://eco.jnu.ac.kr/eco/12253/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWNvJTJGMTg0NSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),

  createDepartmentConfig("architecture", "공과대학", "건축학부", "https://archi.jnu.ac.kr/archi/8023/subview.do", "https://archi.jnu.ac.kr/archi/8023/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYXJjaGklMkYxMDM1JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("polymer", "공과대학", "고분자융합소재공학부", "https://pf.jnu.ac.kr/pf/7821/subview.do", "https://pf.jnu.ac.kr/pf/7821/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcGYlMkY5OTclMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("mechanical", "공과대학", "기계공학부", "https://mech.jnu.ac.kr/mech/8218/subview.do", "https://mech.jnu.ac.kr/mech/8218/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWVjaCUyRjIwMzglMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("industrial", "공과대학", "산업공학과", "https://ie.jnu.ac.kr/ie/22113/subview.do", "https://ie.jnu.ac.kr/ie/22113/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaWUlMkYzNzQ2JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("biotech", "공과대학", "생물공학과", "https://bte.jnu.ac.kr/bte/10981/subview.do", "https://bte.jnu.ac.kr/bte/10981/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYnRlJTJGMTgyNCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("materials", "공과대학", "신소재공학부", "https://mse.jnu.ac.kr/mse/16863/subview.do", "https://mse.jnu.ac.kr/mse/16863/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbXNlJTJGMjA2MCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("energy-resources", "공과대학", "에너지자원공학과", "https://resources.jnu.ac.kr/resources/14018/subview.do", "https://resources.jnu.ac.kr/resources/14018/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcmVzb3VyY2VzJTJGMTE5NCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("chemical", "공과대학", "화학공학부", "https://ace.jnu.ac.kr/ace/12509/subview.do", "https://ace.jnu.ac.kr/ace/12509/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYWNlJTJGMTg2MCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("electrical", "공과대학", "전기공학과", "https://elec.jnu.ac.kr/elec/14099/subview.do", "https://elec.jnu.ac.kr/elec/14099/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWxlYyUyRjEyMDQlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("ece", "공과대학", "전자컴퓨터공학부", "https://eceng.jnu.ac.kr/eceng/20079/subview.do", "https://eceng.jnu.ac.kr/eceng/20079/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWNlbmclMkYzMjg3JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("electronics", "공과대학", "전자공학과", "https://ee.jnu.ac.kr/ee/12439/subview.do", "https://ee.jnu.ac.kr/ee/12439/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWUlMkYxODU2JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("computer-info", "공과대학", "컴퓨터정보통신공학과", "https://ce.jnu.ac.kr/ce/12474/subview.do", "https://ce.jnu.ac.kr/ce/12474/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY2UlMkYyMTE0JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("software", "공과대학", "소프트웨어공학과", "https://sw.jnu.ac.kr/sw/8250/subview.do", "https://sw.jnu.ac.kr/sw/8250/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGc3clMkYxMDM4JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("civil", "공과대학", "토목공학과", "https://civil.jnu.ac.kr/civil/11107/subview.do", "https://civil.jnu.ac.kr/civil/11107/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY2l2aWwlMkYxODI5JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("environment-energy", "공과대학", "환경에너지공학과", "https://eee.jnu.ac.kr/eee/11181/subview.do", "https://eee.jnu.ac.kr/eee/11181/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWVlJTJGMTgzNCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),

  createDepartmentConfig("applied-plant", "농업생명과학대학", "응용식물학과", "https://agro.jnu.ac.kr/agro/4810/subview.do", "https://agro.jnu.ac.kr/agro/4810/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYWdybyUyRjQ0NCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("horticulture", "농업생명과학대학", "원예생명공학과", "https://hort.jnu.ac.kr/hort/5820/subview.do", "https://hort.jnu.ac.kr/hort/5820/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaG9ydCUyRjQ0MSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("applied-biology", "농업생명과학대학", "응용생물학과", "https://agribio.jnu.ac.kr/agribio/5396/subview.do", "https://agribio.jnu.ac.kr/agribio/5396/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYWdyaWJpbyUyRjY0MCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("forestry", "농업생명과학대학", "산림자원학과", "https://forestry.jnu.ac.kr/forestry/4751/subview.do", "https://forestry.jnu.ac.kr/forestry/4751/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZm9yZXN0cnklMkY0MzYlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("wood", "농업생명과학대학", "임산공학과", "https://wood.jnu.ac.kr/wood/5487/subview.do", "https://wood.jnu.ac.kr/wood/5487/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd29vZCUyRjY0NyUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("agrochem", "농업생명과학대학", "농생명화학과", "https://agrochem.jnu.ac.kr/agrochem/5247/subview.do", "https://agrochem.jnu.ac.kr/agrochem/5247/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYWdyb2NoZW0lMkY1NTUlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("food", "농업생명과학대학", "식품공학과", "https://foodsci.jnu.ac.kr/foodsci/5596/subview.do", "https://foodsci.jnu.ac.kr/foodsci/5596/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZm9vZHNjaSUyRjY3OCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("molecular-bio", "농업생명과학대학", "분자생명공학과", "https://mimb.jnu.ac.kr/mimb/5348/subview.do", "https://mimb.jnu.ac.kr/mimb/5348/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWltYiUyRjU2MCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("animal-science", "농업생명과학대학", "동물자원학부", "https://animalscience.jnu.ac.kr/animalscience/4725/subview.do", "https://animalscience.jnu.ac.kr/animalscience/4725/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYW5pbWFsc2NpZW5jZSUyRjQzNSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("regional-bio", "농업생명과학대학", "지역·바이오시스템공학과", "https://rbe.jnu.ac.kr/rbe/4855/subview.do", "https://rbe.jnu.ac.kr/rbe/4855/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcmJlJTJGNDQ3JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("agricultural-econ", "농업생명과학대학", "농업경제학과", "https://ae.jnu.ac.kr/ae/4699/subview.do", "https://ae.jnu.ac.kr/ae/4699/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYWUlMkY0MzAlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("landscape", "농업생명과학대학", "조경학과", "https://jnula.jnu.ac.kr/jnula/5562/subview.do", "https://jnula.jnu.ac.kr/jnula/5562/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGam51bGElMkY2NTUlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("bioenergy", "농업생명과학대학", "바이오에너지공학과", "https://bioenergy.jnu.ac.kr/bioenergy/19179/subview.do", "https://bioenergy.jnu.ac.kr/bioenergy/19179/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYmlvZW5lcmd5JTJGMzA4OCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("bse", "농업생명과학대학", "융합바이오시스템기계공학과", "https://bse.jnu.ac.kr/bse/16824/subview.do", "https://bse.jnu.ac.kr/bse/16824/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYnNlJTJGMjU2OCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),

  createDepartmentConfig("korean-edu", "사범대학", "국어교육과", "https://koredu.jnu.ac.kr/koredu/15485/subview.do", "https://koredu.jnu.ac.kr/koredu/15485/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGa29yZWR1JTJGMjI5MCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("english-edu", "사범대학", "영어교육과", "https://engedu.jnu.ac.kr/engedu/15551/subview.do", "https://engedu.jnu.ac.kr/engedu/15551/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZW5nZWR1JTJGMjI5NSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("education", "사범대학", "교육학과", "https://educate.jnu.ac.kr/educate/15423/subview.do", "https://educate.jnu.ac.kr/educate/15423/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWR1Y2F0ZSUyRjIyODUlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("early-childhood", "사범대학", "유아교육과", "https://ecedu.jnu.ac.kr/ecedu/15739/subview.do", "https://ecedu.jnu.ac.kr/ecedu/15739/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWNlZHUlMkYyMzAzJTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("geo-edu", "사범대학", "지리교육과", "https://geoedu.jnu.ac.kr/geoedu/15675/subview.do", "https://geoedu.jnu.ac.kr/geoedu/15675/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZ2VvZWR1JTJGMjMwMSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("history-edu", "사범대학", "역사교육과", "https://hisedu.jnu.ac.kr/hisedu/15619/subview.do", "https://hisedu.jnu.ac.kr/hisedu/15619/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaGlzZWR1JTJGMjI5NiUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("ethics-edu", "사범대학", "윤리교육과", "https://ethicsedu.jnu.ac.kr/ethicsedu/15801/subview.do", "https://ethicsedu.jnu.ac.kr/ethicsedu/15801/subview.do"),
  createDepartmentConfig("math-edu", "사범대학", "수학교육과", "https://mathedu.jnu.ac.kr/mathedu/15864/subview.do", "https://mathedu.jnu.ac.kr/mathedu/15864/subview.do"),
  createDepartmentConfig("physics-edu", "사범대학", "물리교육과", "https://physicsedu.jnu.ac.kr/physicsedu/15930/subview.do", "https://physicsedu.jnu.ac.kr/physicsedu/15930/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcGh5c2ljc2VkdSUyRjIzMDclMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("chem-edu", "사범대학", "화학교육과", "https://chemedu.jnu.ac.kr/chemedu/15994/subview.do", "https://chemedu.jnu.ac.kr/chemedu/15994/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY2hlbWVkdSUyRjIzMDklMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("bio-edu", "사범대학", "생물교육과", "https://bioedu.jnu.ac.kr/bioedu/16060/subview.do", "https://bioedu.jnu.ac.kr/bioedu/16060/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYmlvZWR1JTJGMjMxMSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("earth-edu", "사범대학", "지구과학교육과", "https://earthedu.jnu.ac.kr/earthedu/16116/subview.do", "https://earthedu.jnu.ac.kr/earthedu/16116/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWFydGhlZHUlMkYyMzE2JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("home-edu", "사범대학", "가정교육과", "https://homeedu.jnu.ac.kr/homeedu/16174/subview.do", "https://homeedu.jnu.ac.kr/homeedu/16174/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaG9tZWVkdSUyRjIzMTglMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("music-edu", "사범대학", "음악교육과", "https://musicedu.jnu.ac.kr/musicedu/16241/subview.do", "https://musicedu.jnu.ac.kr/musicedu/16241/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbXVzaWNlZHUlMkYyMzE5JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("physical-edu", "사범대학", "체육교육과", "https://physicaledu.jnu.ac.kr/physicaledu/16292/subview.do", "https://physicaledu.jnu.ac.kr/physicaledu/16292/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcGh5c2ljYWxlZHUlMkYyMzIwJTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("special-edu", "사범대학", "특수교육학부", "https://spededu.jnu.ac.kr/spededu/16350/subview.do", "https://spededu.jnu.ac.kr/spededu/16350/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGc3BlZGVkdSUyRjIzMjElMkZhcnRjbExpc3QuZG8lM0Y%3D"),

  createDepartmentConfig("politics", "사회과학대학", "정치외교학과", "https://politics.jnu.ac.kr/politics/14166/subview.do", "https://politics.jnu.ac.kr/politics/14166/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcG9saXRpY3MlMkYxNzY2JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("sociology", "사회과학대학", "사회학과", "https://sociology.jnu.ac.kr/sociology/8677/subview.do", "https://sociology.jnu.ac.kr/sociology/8677/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGc29jaW9sb2d5JTJGMTAwMSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("psychology", "사회과학대학", "심리학과", "https://psyche.jnu.ac.kr/psyche/9173/subview.do", "https://psyche.jnu.ac.kr/psyche/9173/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcHN5Y2hlJTJGMTAwNCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("media", "사회과학대학", "미디어커뮤니케이션학과", "https://comm.jnu.ac.kr/comm/8720/subview.do", "https://comm.jnu.ac.kr/comm/8720/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZ29tbSUyRjEwMDMlMkZhcnRjbExpc3QuZG8lM0Y%3D".replace("g29tbS","Y29tbQ==")),
  createDepartmentConfig("geography", "사회과학대학", "지리학과", "https://geo.jnu.ac.kr/geo/12730/subview.do", "https://geo.jnu.ac.kr/geo/12730/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZ2VvJTJGMTg2OCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("anthropology", "사회과학대학", "문화인류고고학과", "https://illyu.jnu.ac.kr/illyu/12696/subview.do", "https://illyu.jnu.ac.kr/illyu/12696/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaWxseXUlMkYxODY2JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("public-admin", "사회과학대학", "행정학과", "https://jnupa.jnu.ac.kr/jnupa/14210/subview.do", "https://jnupa.jnu.ac.kr/jnupa/14210/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGam51cGElMkYxNzMxJTJGYXJ0Y2xMaXN0LmRvJTNG"),

  createDepartmentConfig("welfare", "생활과학대학", "생활복지학과", "https://welfare.jnu.ac.kr/welfare/11249/subview.do", "https://welfare.jnu.ac.kr/welfare/11249/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2VsZmFyZSUyRjE3MDIlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("food-nutrition", "생활과학대학", "식품영양과학부", "https://fn.jnu.ac.kr/fn/16376/subview.do", "https://fn.jnu.ac.kr/fn/16376/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZm4lMkYxMTM5JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("clothing", "생활과학대학", "의류학과", "https://clothing.jnu.ac.kr/clothing/9215/subview.do", "https://clothing.jnu.ac.kr/clothing/9215/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY2xvdGhpbmclMkYxMDA2JTJGYXJ0Y2xMaXN0LmRvJTNG"),

  createDepartmentConfig("pre-vet", "수의과대학", "수의예과", "https://vetmed.jnu.ac.kr/vetmed/12818/subview.do", "https://vetmed.jnu.ac.kr/vetmed/12818/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGdmV0bWVkJTJGMTg3NCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("veterinary-medicine", "수의과대학", "수의학과", "https://vetmed.jnu.ac.kr/vetmed/12818/subview.do", "https://vetmed.jnu.ac.kr/vetmed/12818/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGdmV0bWVkJTJGMTg3NCUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),

  createDepartmentConfig("pharmacy", "약학대학", "약학부", "https://pharmacy.jnu.ac.kr/pharmacy/7190/subview.do", "https://pharmacy.jnu.ac.kr/pharmacy/7190/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcGhhcm1hY3klMkY5NzUlMkZhcnRjbExpc3QuZG8lM0Y%3D"),

  createDepartmentConfig("fineart", "예술대학", "미술학과", "https://fineart.jnu.ac.kr/fineart/9295/subview.do", "https://fineart.jnu.ac.kr/fineart/9295/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZmluZWFydCUyRjEwMDklMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("music", "예술대학", "음악학과", "https://music.jnu.ac.kr/music/8909/subview.do", "https://music.jnu.ac.kr/music/8909/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbXVzaWMlMkYxNjU2JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("korean-music", "예술대학", "국악학과", "https://koreanmusic.jnu.ac.kr/koreanmusic/14242/subview.do", "https://koreanmusic.jnu.ac.kr/koreanmusic/14242/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGa29yZWFubXVzaWMlMkYxMjI0JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("design", "예술대학", "디자인학과", "https://design.jnu.ac.kr/design/9252/subview.do", "https://design.jnu.ac.kr/design/9252/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZGVzaWduJTJGMTAwNyUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),

  createDepartmentConfig("pre-med", "의과대학", "의예과", "https://medicine.jnu.ac.kr/xboard/board.php?tbnum=21", "https://medicine.jnu.ac.kr/xboard/board.php?tbnum=21", "xboard"),
  createDepartmentConfig("medicine", "의과대학", "의학과", "https://medicine.jnu.ac.kr/xboard/board.php?tbnum=21", "https://medicine.jnu.ac.kr/xboard/board.php?tbnum=21", "xboard"),

  createDepartmentConfig("korean-lit", "인문대학", "국어국문학과", "https://korean.jnu.ac.kr/korean/14279/subview.do", "https://korean.jnu.ac.kr/korean/14279/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGa29yZWFuJTJGMTYzNyUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("english-lit", "인문대학", "영어영문학과", "https://ell.jnu.ac.kr/ell/14392/subview.do", "https://ell.jnu.ac.kr/ell/14392/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZWxsJTJGMTU5MiUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("german", "인문대학", "독일언어문학과", "https://german.jnu.ac.kr/german/14320/subview.do", "https://german.jnu.ac.kr/german/14320/subview.do"),
  createDepartmentConfig("french", "인문대학", "불어불문학과", "https://french.jnu.ac.kr/french/13031/subview.do", "https://french.jnu.ac.kr/french/13031/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZnJlbmNoJTJGMjE4OSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("chinese", "인문대학", "중어중문학과", "https://china.jnu.ac.kr/china/14445/subview.do", "https://china.jnu.ac.kr/china/14445/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY2hpbmElMkYxNTcwJTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("japanese", "인문대학", "일어일문학과", "https://nihon.jnu.ac.kr/nihon/10686/subview.do", "https://nihon.jnu.ac.kr/nihon/10686/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbmlob24lMkYxNTc4JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("history", "인문대학", "사학과", "https://history.jnu.ac.kr/history/14361/subview.do", "https://history.jnu.ac.kr/history/14361/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaGlzdG9yeSUyRjE2MDQlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("philosophy", "인문대학", "철학과", "http://philos.jnu.ac.kr/philos/13081/subview.do", "http://philos.jnu.ac.kr/philos/13081/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcGhpbG9zJTJGMjI2MSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),

  createDepartmentConfig("mathematics", "자연과학대학", "수학과", "https://math.jnu.ac.kr/math/13253/subview.do", "https://math.jnu.ac.kr/math/13253/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWF0aCUyRjIwNzYlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("statistics", "자연과학대학", "통계학과", "https://stat.jnu.ac.kr/stat/8951/subview.do", "https://stat.jnu.ac.kr/stat/8951/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGc3RhdCUyRjE1MTElMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("physics", "자연과학대학", "물리학과", "https://physics.jnu.ac.kr/physics/13131/subview.do", "https://physics.jnu.ac.kr/physics/13131/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGcGh5c2ljcyUyRjIxNDAlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("geology", "자연과학대학", "지질환경전공", "https://geology.jnu.ac.kr/geology/10783/subview.do", "https://geology.jnu.ac.kr/geology/10783/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGZ2VvbG9neSUyRjE1MTklMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("oceanography", "자연과학대학", "해양환경전공", "https://oceanography.jnu.ac.kr/oceanography/13327/subview.do", "https://oceanography.jnu.ac.kr/oceanography/13327/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGb2NlYW5vZ3JhcGh5JTJGMjA0MSUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
  createDepartmentConfig("chemistry", "자연과학대학", "화학과", "https://chem.jnu.ac.kr/chem/10822/subview.do", "https://chem.jnu.ac.kr/chem/10822/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY2hlbSUyRjEwMTMlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("biology", "자연과학대학", "생물학과", "https://biology.jnu.ac.kr/biology/18020/subview.do", "https://biology.jnu.ac.kr/biology/18020/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYmlvbG9neSUyRjIxMTMlMkZhcnRjbExpc3QuZG8lM0Y%3D"),
  createDepartmentConfig("sbst", "자연과학대학", "생명과학기술학부", "https://sbst.jnu.ac.kr/sbst/9887/subview.do", "https://sbst.jnu.ac.kr/sbst/9887/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGc2JzdCUyRjE1MjIlMkZhcnRjbExpc3QuZG8lM0Y%3D"),

  createDepartmentConfig("convergence-major", "AI융합대학", "융합전공", "https://cvg.jnu.ac.kr/cvg/3608/subview.do", "https://cvg.jnu.ac.kr/cvg/3608/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGY3ZnJTJGNDA1JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("ai-major", "AI융합대학", "인공지능학부", "https://aisw.jnu.ac.kr/aisw/518/subview.do", "https://aisw.jnu.ac.kr/aisw/518/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYWlzdyUyRjY0JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("bigdata", "AI융합대학", "빅데이터융합학과", "https://bigdata.jnu.ac.kr/bigdata/472/subview.do", "https://bigdata.jnu.ac.kr/bigdata/472/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYmlnZGF0YSUyRjc0JTJGYXJ0Y2xMaXN0LmRvJTNG"),
  createDepartmentConfig("mobility", "AI융합대학", "미래모빌리티학과", "https://mobility.jnu.ac.kr/imob/498/subview.do", "https://mobility.jnu.ac.kr/imob/498/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGaW1vYiUyRjY5JTJGYXJ0Y2xMaXN0LmRvJTNG"),

  createDepartmentConfig("self-designed", "자율전공학부", "자율전공학부", "https://sdis.jnu.ac.kr/sdis/1950/subview.do", "https://sdis.jnu.ac.kr/sdis/1950/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGc2RpcyUyRjI0NyUyRmFydGNsTGlzdC5kbyUzRg%3D%3D"),
];

export const enabledDepartmentConfigs = departmentConfigs.filter((department) => department.enabled);