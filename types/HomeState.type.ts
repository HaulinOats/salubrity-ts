import { Hospital } from "./Hospital.type";
import { User } from "./User.type";

export interface HomeState {
  activeHomeTab: string;
  activeRecord: any;
  allOptions: [];
  allUsers: [];
  callNeeds: undefined;
  completedCalls: any[];
  confirmationType: undefined | string;
  errorArr: string[];
  hospitals: undefined;
  hospitalsById: undefined | Hospital[];
  itemsById: undefined;
  lastUpdateHide: boolean;
  lineProcedures: [];
  linesSortBy: string;
  modalIsOpen: boolean;
  modalTitle: string;
  modalMessage: string;
  modalConfirmation: boolean;
  onlineUsersVisible: boolean;
  onlineUsers: [];
  orderChangeById: [];
  orderChanges: undefined;
  procedures: [];
  proceduresById: undefined;
  queueItems: any[];
  selectedProcedures: [];
  statusById: undefined;
  user: undefined | User;
  userMenuVisible: boolean;
  usersById: undefined | User[];
}
