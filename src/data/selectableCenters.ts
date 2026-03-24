import {
  centerBoardConfigs,
  enabledCenterBoardConfigs,
} from "@/features/notices/config/centerBoards";

export const selectableCenters = centerBoardConfigs;
export const selectableCenterKeys = enabledCenterBoardConfigs.map((center) => center.key);
