"use client";

import { useEffect, useState } from "react";

type UseSelectedCategoriesOptions = {
  storageKey: string;
};

function getLegacyStorageKey(storageKey: string) {
  const separatorIndex = storageKey.indexOf("::");
  return separatorIndex >= 0 ? storageKey.slice(0, separatorIndex) : null;
}

export function useSelectedCategories(
  allCategoryKeys: string[],
  options: UseSelectedCategoriesOptions,
) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategoryKeys);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const currentStorageKey = options.storageKey;
    const legacyStorageKey = getLegacyStorageKey(currentStorageKey);
    const savedValue = window.localStorage.getItem(currentStorageKey);
    const fallbackValue = !savedValue && legacyStorageKey
      ? window.localStorage.getItem(legacyStorageKey)
      : null;
    const valueToLoad = savedValue ?? fallbackValue;

    if (!valueToLoad) {
      setIsReady(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(valueToLoad) as string[];
      const validValues = parsedValue.filter((value) => allCategoryKeys.includes(value));
      const nextValues = validValues.length > 0 ? validValues : [];

      setSelectedCategories(nextValues);

      // One-time migration from the old shared key to the per-account scoped key.
      if (!savedValue && fallbackValue) {
        window.localStorage.setItem(currentStorageKey, JSON.stringify(nextValues));
      }
    } catch {
      setSelectedCategories(allCategoryKeys);
    } finally {
      setIsReady(true);
    }
  }, [allCategoryKeys, options.storageKey]);

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