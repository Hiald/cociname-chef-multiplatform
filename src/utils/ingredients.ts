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

export interface ChecklistIngredientItem {
  IngredientId?: number | string;
  TotalSize?: number | string;
}

export interface IngredientChecklistRecord {
  jsonIngredientsCheckList?: string | null;
}

export function aggregateChecklistIngredients(items: ChecklistIngredientItem[]) {
  const totals = new Map<number, number>();

  items.forEach((item) => {
    const ingredientId = Number(item.IngredientId);
    const totalSize = parseFloat(String(item.TotalSize ?? 0));

    if (!ingredientId || Number.isNaN(totalSize)) return;

    totals.set(ingredientId, (totals.get(ingredientId) ?? 0) + totalSize);
  });

  return Array.from(totals.entries()).map(([IngredientId, TotalSize]) => ({
    IngredientId,
    TotalSize: String(TotalSize),
  }));
}

export function collectChecklistIngredients(checklistRecords: IngredientChecklistRecord[] = []) {
  const parsedItems: ChecklistIngredientItem[] = [];

  checklistRecords.forEach((record) => {
    if (!record?.jsonIngredientsCheckList) return;

    try {
      const items = JSON.parse(record.jsonIngredientsCheckList);
      if (Array.isArray(items)) {
        parsedItems.push(...items);
      }
    } catch {
      // Ignorar registros con JSON inválido
    }
  });

  return aggregateChecklistIngredients(parsedItems);
}

export async function loadIngredientDetailsFromChecklist(
  checklistRecords: IngredientChecklistRecord[],
  fetchIngredientById: (ingredientId: number) => Promise<{
    success: boolean;
    data?: { name: string; unit: number } | null;
  }>,
  formatQuantity: (size: number, unit: number) => string
) {
  const aggregatedItems = collectChecklistIngredients(checklistRecords);

  const ingredientsDetails = await Promise.all(
    aggregatedItems.map(async (item) => {
      try {
        const details = await fetchIngredientById(item.IngredientId);
        const size = parseFloat(item.TotalSize);

        if (details.success && details.data) {
          return {
            id: item.IngredientId,
            ingredientId: item.IngredientId,
            ingredientName: details.data.name,
            quantity: formatQuantity(size, details.data.unit),
            unit: details.data.unit,
            rawSize: item.TotalSize,
          };
        }
      } catch (error) {
        console.error(`Error cargando ingrediente ${item.IngredientId}:`, error);
      }

      return {
        id: item.IngredientId,
        ingredientId: item.IngredientId,
        ingredientName: `Ingrediente #${item.IngredientId}`,
        quantity: `${parseFloat(item.TotalSize).toFixed(2)} kg`,
        unit: 2,
        rawSize: item.TotalSize,
      };
    })
  );

  return sortIngredientsAlphabetically(ingredientsDetails);
}
