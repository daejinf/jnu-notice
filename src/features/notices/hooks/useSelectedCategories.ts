"use client";

import { useEffect, useState } from "react";

type UseSelectedCategoriesOptions = {
  storageKey: string;
};

export function useSelectedCategories(
  allCategoryKeys: string[],
  options: UseSelectedCategoriesOptions,
) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategoryKeys);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(options.storageKey);

    if (!savedValue) {
      setIsReady(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(savedValue) as string[];
      const validValues = parsedValue.filter((value) => allCategoryKeys.includes(value));
      setSelectedCategories(validValues.length > 0 ? validValues : []);
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
