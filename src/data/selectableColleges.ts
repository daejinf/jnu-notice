import { collegeBoardConfigs, enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";

export const selectableColleges = collegeBoardConfigs;
export const selectableCollegeKeys = enabledCollegeBoardConfigs.map((college) => college.key);
