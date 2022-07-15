export interface Option {
  id: string;
  callFieldName: string;
  inputType: string;
  name: string;
  optionId: number;
  options:
    | {
        id: number;
        name: string;
        seq?: number;
      }[]
    | null;
}
