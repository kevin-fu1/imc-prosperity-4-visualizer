// A product's group is the longest underscore-delimited prefix it shares with at least one
// other product. SNACKPACK_CHOCOLATE + SNACKPACK_VANILLA → "SNACKPACK".
// GALAXY_SOUNDS_DARK_MATTER + GALAXY_SOUNDS_BLACK_HOLES → "GALAXY_SOUNDS" (longer wins).
// A product with no shared prefix (e.g. TOMATOES) is its own group.
export function getProductGroup(product: string, allProducts: string[]): string {
  const parts = product.split('_');
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join('_');
    const prefixWithSep = prefix + '_';
    if (allProducts.some(p => p !== product && p.startsWith(prefixWithSep))) {
      return prefix;
    }
  }
  return product;
}

export function getProductGroups(products: string[]): string[] {
  const groups = new Set<string>();
  for (const p of products) {
    groups.add(getProductGroup(p, products));
  }
  return [...groups].sort();
}
