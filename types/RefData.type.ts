import { User } from "./User.type";
import { Option } from "./Option.type";
import { Procedure } from "./Procedure.type";
import { DropdownOption } from "./DropdownOption.type";
import { Item } from "./Item.type";

export interface RefData {
  callNeeds: Option | undefined;
  hospitals: Option | undefined;
  hospitalsById: { [key: number]: DropdownOption } | undefined;
  items: Item[];
  itemsById: { [key: number]: Item } | undefined;
  options: Option[];
  orderChanges: Option | undefined;
  orderChangeById: { [key: number]: DropdownOption } | undefined;
  procedures: Procedure[];
  proceduresById: { [key: number]: Procedure } | undefined;
  statuses: Option | undefined;
  statusById: { [key: number]: DropdownOption } | undefined;
  users: User[];
  usersById: { [key: number]: User } | undefined;
}

export const RefDataDefault = {
  callNeeds: undefined,
  hospitals: undefined,
  hospitalsById: undefined,
  items: [] as Item[],
  itemsById: undefined,
  orderChanges: undefined,
  options: [] as Option[],
  orderChangeById: undefined,
  procedures: [] as Procedure[],
  proceduresById: undefined,
  statuses: undefined,
  statusById: undefined,
  users: [] as User[],
  usersById: undefined,
};
