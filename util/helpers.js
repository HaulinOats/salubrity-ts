import axios from "axios";

export const getDateFromObjectId = (objId) => {
  if (objId) return new Date(parseInt(objId.substring(0, 8), 16) * 1000);
};

export default {
  getAllUsers: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-all-users" })
        .then((resp) => {
          let usersObj = {};
          for (let i = 0; i < resp.data.length; i++) {
            let user = resp.data[i];
            usersObj[resp.data[i].userId] = user;
          }
          resolve({
            usersById: usersObj,
            usersArr: resp.data,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  adminGetAllUsers: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/admin-get-all-users" })
        .then((resp) => {
          let usersObj = {};
          for (let i = 0; i < resp.data.length; i++) {
            let user = resp.data[i];
            usersObj[resp.data[i].userId] = user;
          }
          resolve({
            usersById: usersObj,
            usersArr: resp.data,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getActiveCalls: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-active-calls" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            resolve(resp.data);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getOpenLineProcedures: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-open-line-procedures" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            let lineProcedures = resp.data;
            lineProcedures.forEach((lineProcedure, idx) => {
              lineProcedures[idx].isHidden = false;
            });
            resolve(resp.data);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getOnlineUsers: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-online-users" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            resolve(resp.data);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getCompletedCalls: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-completed-calls" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            resolve(resp.data);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getProcedureData: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-procedures" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            let proceduresById = {};
            for (let i = 0; i < resp.data.procedures.length; i++) {
              proceduresById[resp.data.procedures[i].procedureId] =
                resp.data.procedures[i];
            }
            let procedures = resp.data.procedures;
            procedures.sort((a, b) => {
              if (a.seq > b.seq) return 1;
              if (a.seq < b.seq) return -1;
              return 0;
            });
            resolve({
              proceduresById,
              procedures,
            });
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getOptionsData: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-options" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            let respData = resp.data;
            let hospitals;
            let orderChanges;
            let orderChangeById = {};
            let hospitalsById = {};
            let statuses = {};
            let callNeeds;

            respData.forEach((optionItem, idx) => {
              switch (optionItem.callFieldName) {
                case "hospital":
                  hospitals = respData[idx];
                  break;
                case "orderChange":
                  orderChanges = respData[idx];
                  break;
                case "status":
                  statuses = respData[idx];
                  break;
                case "callNeeds":
                  callNeeds = respData[idx];
                  break;
                default:
              }
            });

            hospitals.options.forEach((hospital) => {
              hospitalsById[hospital.id] = hospital;
            });

            orderChanges.options.forEach((order) => {
              orderChangeById[order.id] = order;
            });

            statuses.options.forEach((status) => {
              statuses[status.id] = status;
            });

            callNeeds.options.sort((a, b) => {
              if (a.seq > b.seq) return 1;
              if (a.seq < b.seq) return -1;
              return 0;
            });

            resolve({
              options: respData,
              hospitals: hospitals.options,
              hospitalsById,
              orderChanges,
              orderChangeById,
              statuses,
              callNeeds: callNeeds.options,
            });
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getItemsData: async () => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { path: "/get-items" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            let items = {};
            resp.data.forEach((item) => {
              items[item.itemId] = item;
            });
            resolve(items);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getCallById: (callId, userId) => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { _id: callId, userId, path: "/get-call-by-id" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            if (resp.data.isOpen) {
              reject(resp.data);
            } else {
              resolve(resp.data);
            }
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getOpenCallForUser: (userId) => {
    return new Promise((resolve, reject) => {
      axios
        .post("/api/main", { openBy: userId, path: "/get-open-call-for-user" })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            reject(resp.data);
          } else {
            resolve(resp.data);
          }
        });
    });
  },
};
