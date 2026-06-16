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
  ingredientId?: number | string;
  TotalSize?: number | string;
  totalSize?: number | string;
}

export interface IngredientChecklistRecord {
  jsonIngredientsCheckList?: string | null;
  JsonIngredientsCheckList?: string | null;
}

function getChecklistJson(record: IngredientChecklistRecord) {
  return record.jsonIngredientsCheckList ?? record.JsonIngredientsCheckList ?? null;
}

function getChecklistItemId(item: ChecklistIngredientItem) {
  return Number(item.IngredientId ?? item.ingredientId);
}

function getChecklistItemSize(item: ChecklistIngredientItem) {
  return parseFloat(String(item.TotalSize ?? item.totalSize ?? 0));
}

export function aggregateChecklistIngredients(items: ChecklistIngredientItem[]) {
  const totals = new Map<number, number>();

  items.forEach((item) => {
    const ingredientId = getChecklistItemId(item);
    const totalSize = getChecklistItemSize(item);

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
    const checklistJson = getChecklistJson(record);
    if (!checklistJson) return;

    try {
      const items = JSON.parse(checklistJson);
      if (Array.isArray(items)) {
        parsedItems.push(...items);
      }
    } catch {
      // Ignorar registros con JSON inválido
    }
  });

  return aggregateChecklistIngredients(parsedItems);
}

export interface LoadedIngredientDetail {
  id: number | string;
  ingredientId?: number | string;
  ingredientName: string;
  quantity: string;
  unit: number;
  rawSize: number | string;
}

export function aggregateIngredientDetailsByName<T extends LoadedIngredientDetail>(
  items: T[],
  formatQuantity: (size: number, unit: number) => string
): T[] {
  const groups = new Map<string, { item: T; totalSize: number }>();

  items.forEach((item) => {
    const nameKey = (item.ingredientName || '').trim().toLowerCase();
    const unit = Number(item.unit ?? 0);
    const groupKey = `${nameKey}::${unit}`;
    const size = parseFloat(String(item.rawSize ?? 0));

    if (!nameKey || Number.isNaN(size)) return;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.totalSize += size;
    } else {
      groups.set(groupKey, { item, totalSize: size });
    }
  });

  return Array.from(groups.values()).map(({ item, totalSize }) => ({
    ...item,
    rawSize: String(totalSize),
    quantity: formatQuantity(totalSize, item.unit),
  }));
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

  const mergedByName = aggregateIngredientDetailsByName(ingredientsDetails, formatQuantity);

  return sortIngredientsAlphabetically(mergedByName);
}
