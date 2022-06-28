export default interface OrderChange {
  callFieldName: string;
  inputType: string;
  name: string;
  optionId: number;
  options: { id: number; name: string }[];
}
