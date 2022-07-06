import { Call } from "./Call.type";
import { Procedure } from "./Procedure.type";
import { User } from "./User.type";

export interface HomeState {
  activeHomeTab: string;
  activeCall: undefined | Call;
  completedCalls: Call[];
  confirmationType: undefined | string;
  errorArr: string[];
  lastUpdateHide: boolean;
  lineProcedures: Procedure[];
  linesSortBy: string;
  onlineUsersVisible: boolean;
  onlineUsers: string[];
  procedures: Procedure[];
  queueItems: Call[];
  selectedProcedures: Procedure[];
  user: undefined | User;
  userMenuVisible: boolean;
}

export const HomeStateDefault = {
  activeHomeTab: "queue",
  activeCall: undefined,
  completedCalls: [],
  confirmationType: undefined,
  errorArr: [],
  lastUpdateHide: false,
  lineProcedures: [],
  linesSortBy: "dressingChangeDate",
  onlineUsers: [],
  onlineUsersVisible: false,
  procedures: [],
  queueItems: [],
  selectedProcedures: [],
  user: undefined,
  userMenuVisible: false,
};
