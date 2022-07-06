export interface Procedure {
  [key: number]: any;
  _id: string;
  procedureId: number;
  name: string;
  seq: number;
  groups: {
    _id: string;
    seq: number;
    groupName: string;
    hideHeader: boolean;
    hideGroup: boolean;
    fieldName: string;
    inputType: string;
    groupItems: number[];
  }[];
}
