export default interface Option {
  optionId: number;
  name: string;
  inputType: string;
  callFieldName: string;
  options: undefined | Object[];
}
