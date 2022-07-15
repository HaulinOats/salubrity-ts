import { Call } from "./Call.type";
import { Procedure } from "./Procedure.type";
import { User } from "./User.type";

export interface HomeState {
  activeTab: string;
  activeCall: undefined | Call;
  completedCalls: Call[];
  confirmationType: undefined | string;
  errorArr: string[];
  lastUpdateHide: boolean;
  lineProcedures: Call[];
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
  activeTab: "queue",
  activeCall: undefined,
  completedCalls: [] as Call[],
  confirmationType: undefined,
  errorArr: [] as string[],
  lastUpdateHide: false,
  lineProcedures: [] as Call[],
  linesSortBy: "dressingChangeDate",
  onlineUsers: [] as string[],
  onlineUsersVisible: false,
  procedures: [] as Procedure[],
  queueItems: [] as Call[],
  selectedProcedures: [] as Procedure[],
  user: undefined,
  userMenuVisible: false,
};
