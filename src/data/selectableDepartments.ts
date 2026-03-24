import { departmentConfigs, enabledDepartmentConfigs } from "@/features/notices/config/departments";

export const selectableDepartments = departmentConfigs;
export const selectableDepartmentKeys = enabledDepartmentConfigs.map((department) => department.key);
