export interface Item {
  [key: number]: any;
  itemId: number;
  procedureName: string;
  procedureId: number;
  groupName: string;
  fieldName: undefined | string;
  value: undefined | string | number;
  isCustom: boolean;
  fieldAbbr: string;
  valuePrefix: string;
  valueSuffix: string;
}
