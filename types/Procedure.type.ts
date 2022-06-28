export default interface Procedure {
  _id: string;
  procedureId: number;
  name: string;
  seq: number;
  groups: {
    seq: number;
    groupName: string;
    hideHeader: boolean;
    hideGroup: boolean;
    fieldName: string;
    inputType: string;
    groupItems: number[];
  }[];
}
