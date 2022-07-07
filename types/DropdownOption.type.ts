export interface DropdownOption {
  name: any;
  [key: number]: {
    id: number;
    name: string;
    seq?: number;
  };
}
