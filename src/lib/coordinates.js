// Missing coordinates are not zero. Never manufacture a map point from null/"".
export function hasFiniteCoordinates(value) {
  return value?.lat!=null&&value?.lng!=null&&String(value.lat).trim()!==''&&String(value.lng).trim()!==''&&
    Number.isFinite(Number(value.lat))&&Number.isFinite(Number(value.lng))&&Math.abs(Number(value.lat))<=90&&Math.abs(Number(value.lng))<=180;
}
