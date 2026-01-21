/**
 * Move an item in an array up or down by one position.
 * Returns a new array with the item moved.
 */
export function moveItem<T>(
  items: T[],
  index: number,
  direction: 'up' | 'down'
): T[] {
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= items.length) {
    return items;
  }

  const updated = [...items];
  [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
  return updated;
}

/**
 * Update an item at a specific index with partial updates.
 * Returns a new array with the updated item.
 */
export function updateItem<T>(
  items: T[],
  index: number,
  updates: Partial<T>
): T[] {
  const updated = [...items];
  updated[index] = { ...updated[index], ...updates };
  return updated;
}

/**
 * Remove an item at a specific index.
 * Returns a new array without the removed item.
 */
export function removeItem<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

/**
 * Insert an item at a specific index.
 * Returns a new array with the item inserted.
 */
export function insertItem<T>(items: T[], index: number, item: T): T[] {
  const updated = [...items];
  updated.splice(index, 0, item);
  return updated;
}

/**
 * Append an item to the end of an array.
 * Returns a new array with the item appended.
 */
export function appendItem<T>(items: T[], item: T): T[] {
  return [...items, item];
}

/**
 * Update a nested array field within an item at a specific index.
 * Useful for updating quiz question options.
 */
export function updateNestedArray<T, K extends keyof T>(
  items: T[],
  itemIndex: number,
  field: K,
  nestedIndex: number,
  value: T[K] extends (infer U)[] ? U : never
): T[] {
  const updated = [...items];
  const item = updated[itemIndex];
  const nestedArray = item[field];

  if (!Array.isArray(nestedArray)) {
    return items;
  }

  const newNestedArray = [...nestedArray];
  newNestedArray[nestedIndex] = value;
  updated[itemIndex] = { ...item, [field]: newNestedArray };
  return updated;
}
