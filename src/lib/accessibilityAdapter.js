import { getAccessibilityAdaptations } from "../data/accessibilityAdaptations.js";

export function buildAccessibilityGuidance(selectedIds = []) {
  return getAccessibilityAdaptations(selectedIds).map((item) =>
    `${item.label}: ${item.guidance} ${item.materialGuidance}`
  );
}

export function applyAccessibilityAdaptations(activity, selectedIds = []) {
  return {
    ...activity,
    accessibility: buildAccessibilityGuidance(selectedIds)
  };
}
