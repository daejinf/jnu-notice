"use client";

import { useEffect, useState } from "react";

type UseSelectedCategoriesOptions = {
  storageKey: string;
  defaultSelectedKeys?: string[];
  legacyDefaultSelectedKeys?: string[];
};

function getLegacyStorageKey(storageKey: string) {
  const separatorIndex = storageKey.indexOf("::");
  return separatorIndex >= 0 ? storageKey.slice(0, separatorIndex) : null;
}

export function useSelectedCategories(
  allCategoryKeys: string[],
  options: UseSelectedCategoriesOptions,
) {
  const defaultSelectedKeys = options.defaultSelectedKeys ?? [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(defaultSelectedKeys);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const currentStorageKey = options.storageKey;
    const legacyStorageKey = getLegacyStorageKey(currentStorageKey);
    const savedValue = window.localStorage.getItem(currentStorageKey);
    const fallbackValue = !savedValue && legacyStorageKey
      ? window.localStorage.getItem(legacyStorageKey)
      : null;
    const valueToLoad = savedValue ?? fallbackValue;
    const migrationKey = `${currentStorageKey}::legacy-default-migrated`;

    if (!valueToLoad) {
      setSelectedCategories(defaultSelectedKeys);
      window.localStorage.setItem(migrationKey, "1");
      setIsReady(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(valueToLoad) as string[];
      const validValues = parsedValue.filter((value) => allCategoryKeys.includes(value));
      const legacyDefaultKeys = options.legacyDefaultSelectedKeys ?? [];
      const isUnmigratedLegacyDefault =
        window.localStorage.getItem(migrationKey) !== "1" &&
        legacyDefaultKeys.length > 0 &&
        validValues.length === legacyDefaultKeys.length &&
        legacyDefaultKeys.every((value) => validValues.includes(value));
      const nextValues = isUnmigratedLegacyDefault ? [] : validValues;

      setSelectedCategories(nextValues);
      window.localStorage.setItem(migrationKey, "1");

      // One-time migration from the old shared key to the per-account scoped key.
      if (!savedValue && fallbackValue) {
        window.localStorage.setItem(currentStorageKey, JSON.stringify(nextValues));
      }
    } catch {
      setSelectedCategories(defaultSelectedKeys);
    } finally {
      setIsReady(true);
    }
  }, [allCategoryKeys, defaultSelectedKeys, options.legacyDefaultSelectedKeys, options.storageKey]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(options.storageKey, JSON.stringify(selectedCategories));
  }, [isReady, options.storageKey, selectedCategories]);

  function toggleCategory(categoryKey: string) {
    setSelectedCategories((current) => {
      if (current.includes(categoryKey)) {
        return current.filter((key) => key !== categoryKey);
      }

      return [...current, categoryKey];
    });
  }

  function selectAllCategories() {
    setSelectedCategories(allCategoryKeys);
  }

  function clearCategories() {
    setSelectedCategories([]);
  }

  return {
    selectedCategories,
    setSelectedCategories,
    toggleCategory,
    selectAllCategories,
    clearCategories,
    isReady,
  };
}
