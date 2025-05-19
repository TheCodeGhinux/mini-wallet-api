/**
 * Recursively converts object keys from snake_case to camelCase
 * Works with nested objects and arrays
 */
function snakeToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as unknown as T;
  } else if (
    obj !== null &&
    typeof obj === "object" &&
    obj.constructor === Object
  ) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        snakeToCamel(value),
      ]),
    ) as unknown as T;
  }
  return obj;
}

export default snakeToCamel;
