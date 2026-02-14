// --- Type detection helpers ---
export const isNumericType = (type: string) => /int|float|double|decimal|numeric|number|bigint|real/i.test(type);
export const isDateType = (type: string) => /date|time|timestamp/i.test(type);
export const isTextType = (type: string) => !isNumericType(type) && !isDateType(type);
