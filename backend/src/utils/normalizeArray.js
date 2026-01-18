const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      return [value];
    } catch (e) {
      return value.split(",").map(s => s.trim()).filter(Boolean);
    }
  }
  return value ? [value] : [];
};

export { normalizeArray };