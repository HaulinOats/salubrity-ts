import axios from "axios";
import { Call } from "../types/Call.type";
import { DropdownOption } from "../types/DropdownOption.type";
import { Item } from "../types/Item.type";
import { Option } from "../types/Option.type";
import { Procedure } from "../types/Procedure.type";

export default {
  getDateFromObjectId: (objId: string) => {
    return new Date(parseInt(objId.substring(0, 8), 16) * 1000);
  },
  getItemData: async (openBy: number): Promise<any> => {
    try {
      let itemData = await fetch("/api/main", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "/get-item-data",
          openBy,
        }),
      });
      return itemData;
    } catch (err) {
      return err;
    }
  },
  getAllUsers: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/get-all-users" })
      .then((resp) => {
        let usersObj: any = {};
        for (let i = 0; i < resp.data.length; i++) {
          let user = resp.data[i];
          usersObj[resp.data[i].userId] = user;
        }
        return {
          usersById: usersObj,
          users: resp.data,
        };
      })
      .catch((err) => {
        return err;
      });
  },

  adminGetAllUsers: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/admin-get-all-users" })
      .then((resp) => {
        let usersObj: any = {};
        for (let i = 0; i < resp.data.length; i++) {
          let user = resp.data[i];
          usersObj[resp.data[i].userId] = user;
        }
        return {
          usersById: usersObj,
          usersArr: resp.data,
        };
      })
      .catch((err) => {
        return err;
      });
  },

  getActiveCalls: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/get-active-calls" })
      .then((resp) => {
        return resp.data;
      })
      .catch((err) => {
        return err;
      });
  },

  getOpenLineProcedures: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/get-open-line-procedures" })
      .then((resp) => {
        let lineProcedures = resp.data;
        lineProcedures.forEach((_lineProcedure: Call, idx: number) => {
          lineProcedures[idx].isHidden = false;
        });
        return resp.data;
      })
      .catch((err) => {
        return err;
      });
  },

  getOnlineUsers: async (): Promise<any> => {
    axios
      .post("/api/main", { path: "/get-online-users" })
      .then((resp) => {
        return resp.data;
      })
      .catch((err) => {
        return err;
      });
  },

  getCompletedCalls: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/get-completed-calls" })
      .then((resp) => {
        return resp.data;
      })
      .catch((err) => {
        return err;
      });
  },

  getProcedureData: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/get-procedures" })
      .then((resp) => {
        let proceduresById: { [key: number]: Procedure } = {};
        let procedures: Procedure[] = resp.data;
        for (let i = 0; i < procedures.length; i++) {
          proceduresById[procedures[i].procedureId] = procedures[i];
        }
        procedures.sort((a: Procedure, b: Procedure) => {
          if (a.seq > b.seq) return 1;
          if (a.seq < b.seq) return -1;
          return 0;
        });
        return {
          proceduresById,
          procedures,
        };
      })
      .catch((err) => {
        return err;
      });
  },

  getOptionsData: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/get-options" })
      .then((resp) => {
        let options: Option[] = resp.data;
        let callNeeds: Option;
        let hospitals: Option;
        let hospitalsById: { [key: number]: DropdownOption } = {};
        let orderChangeById: { [key: number]: DropdownOption } = {};
        let orderChanges: Option;
        let statusById: { [key: number]: DropdownOption } = {};
        let statuses: Option;

        options.forEach((option: Option, idx: number) => {
          switch (option.callFieldName) {
            case "hospital":
              hospitals = options[idx];
              break;
            case "orderChange":
              orderChanges = options[idx];
              break;
            case "status":
              statuses = options[idx];
              break;
            case "callNeeds":
              callNeeds = options[idx];
              break;
            default:
          }
        });

        hospitals!.options!.forEach((option) => {
          hospitalsById[option.id] = option;
        });

        orderChanges!.options!.forEach((order) => {
          orderChangeById[order.id] = order;
        });

        statuses!.options!.forEach((status) => {
          statusById[status.id] = status;
        });

        callNeeds!.options!.sort((a: any, b: any) => {
          if (a.seq > b.seq) return 1;
          if (a.seq < b.seq) return -1;
          return 0;
        });

        return {
          options,
          hospitals: hospitals!,
          hospitalsById,
          orderChanges: orderChanges!,
          orderChangeById,
          statusById,
          statuses: statuses!,
          callNeeds: callNeeds!,
        };
      })
      .catch((err) => {
        return err;
      });
  },

  getItemsData: async (): Promise<any> => {
    return axios
      .post("/api/main", { path: "/get-items" })
      .then((resp) => {
        let items = resp.data;
        let itemsById: { [key: number]: Item } = {};
        items.forEach((item: Item) => {
          itemsById[item.itemId] = item;
        });
        return {
          items,
          itemsById,
        };
      })
      .catch((err) => {
        return err;
      });
  },

  getCallById: (callId: string, userId: number): any => {
    return axios
      .post("/api/main", { _id: callId, userId, path: "/get-call-by-id" })
      .then((resp) => {
        return resp.data;
      })
      .catch((err) => {
        return err;
      });
  },

  getOpenCallForUser: (userId: number): any => {
    return axios
      .post("/api/main", { userId, path: "/get-open-call-for-user" })
      .then((resp) => {
        return resp.data;
      });
  },
};
