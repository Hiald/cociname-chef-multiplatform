export function getIngredientSortKey(item: { ingredientName?: string; name?: string }) {
  return (item.ingredientName || item.name || '').trim().toLowerCase();
}

export function sortIngredientsAlphabetically<T extends { ingredientName?: string; name?: string }>(
  items: T[]
): T[] {
  return [...items].sort((left, right) =>
    getIngredientSortKey(left).localeCompare(getIngredientSortKey(right), 'es', { sensitivity: 'base' })
  );
}
