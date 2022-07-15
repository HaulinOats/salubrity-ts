import { Call } from "./Call.type";
import { HomeState } from "./HomeState.type";

export interface AdminState extends HomeState {
  addFullName: string | undefined;
  addUserName: string | undefined;
  addPassword: string | undefined;
  addAdminAccess: boolean;
  secondDropdownArr: any[];
  addHospitalName: string | undefined;
  addOrderChangeName: string | undefined;
  addNeedName: string | undefined;
  menuIsVisible: boolean;
  customRoute: string | undefined;
  JSONFileName: string | undefined;
  hideUI: boolean;
  insertionAgg: any[];
  hospitalAgg: any[];
  updateAdminPassword: boolean;
  adminUsername: string | undefined;
  adminPassword: string | undefined;
  adminNewPassword: string | undefined;
  adminNewPasswordConfirm: string | undefined;
  queriedCalls: Call[];
}

export const AdminStateDefault = {
  user: undefined,
  addFullName: undefined,
  addUserName: undefined,
  addPassword: undefined,
  addAdminAccess: false,
  secondDropdownArr: [],
  addHospitalName: undefined,
  addOrderChangeName: undefined,
  addNeedName: undefined,
  menuIsVisible: false,
  customRoute: undefined,
  JSONFileName: undefined,
  hideUI: false,
  insertionAgg: [],
  hospitalAgg: [],
  updateAdminPassword: false,
  adminUsername: undefined,
  adminPassword: undefined,
  adminNewPassword: undefined,
  adminNewPasswordConfirm: undefined,
  queriedCalls: [] as Call[],
};
