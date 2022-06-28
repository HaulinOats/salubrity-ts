export default interface Item {
  itemId: number;
  procedureName: string;
  procedureId: number;
  groupName: string;
  fieldName: undefined | string;
  value: undefined | string;
  isCustom: boolean;
  fieldAbbr: string;
  valuePrefix: string;
  valueSuffix: string;
}
