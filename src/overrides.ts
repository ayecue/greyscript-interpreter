import { CustomMap, CustomString } from 'greybel-interpreter';

export const CLASS_ID_PROPERTY = new CustomString('classID');
const defaultCustomMapToString = CustomMap.prototype.toString;

CustomMap.prototype.toString = function (depth: number = 0) {
  if (this.value.has(CLASS_ID_PROPERTY)) {
    return this.value.get(CLASS_ID_PROPERTY).toString();
  }
  return defaultCustomMapToString.call(this, depth);
};
