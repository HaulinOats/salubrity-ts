import { NextPage } from "next";
import { ChangeEvent, createContext, useEffect, useRef, useState } from "react";
import { User } from "../types/User.type";
import helpers from "../util/helpers";
import { getItemFromStorage } from "../util/storage";
import { Call } from "../types/Call.type";
import { RefData as RefDataType, RefDataDefault } from "../types/RefData.type";
import { HomeStateDefault } from "../types/HomeState.type";
import {
  AdminState as AdminStateType,
  AdminStateDefault,
} from "../types/AdminState.type";
import Modal from "../components/Modal";
import { ModalState, ModalStateDefault } from "../types/ModalState.type";
import axios from "axios";
import EditProcedure from "../components/EditProcedure";
import ReturnedProcedures from "../components/ReturnedProcedures";
import Filters from "../components/Filters";
import Login from "../components/Login";
import { DebounceInput } from "react-debounce-input";

export const RefData = createContext<RefDataType>(RefDataDefault);

const Admin: NextPage = () => {
  const [lastLogin, setLastLogin] = useState(Date.now());
  const [adminState, setAdminState] = useState<AdminStateType>({
    ...AdminStateDefault,
    ...HomeStateDefault,
  });
  const [refDataState, setRefDataState] = useState<RefDataType>(RefDataDefault);
  const sessionInterval = useRef<undefined | ReturnType<typeof setInterval>>(
    undefined
  );
  const [modalState, setModalState] = useState<ModalState>(ModalStateDefault);

  useEffect(() => {
    let newAdminState: any = {};
    let user = getItemFromStorage("user");

    if (user) {
      adminState.user = user;
      startSessionInterval();
    }

    stateLoadCalls(newAdminState);

    return () => {
      clearInterval(sessionInterval.current);
    };
  }, []);

  const stateLoadCalls = async (newHomeState: any) => {
    let newRefDataValues: any = {};
    let newHomeStateValues = newHomeState;

    try {
      console.log("trying state load calls");
      //get users
      let { users, usersById } = await helpers.adminGetAllUsers();
      newRefDataValues.users = users;
      newRefDataValues.usersById = usersById;

      //get options data
      const {
        options,
        hospitals,
        hospitalsById,
        orderChanges,
        orderChangeById,
        statusById,
        statuses,
        callNeeds,
      } = await helpers.getOptionsData();
      newRefDataValues.options = options;
      newRefDataValues.hospitals = hospitals;
      newRefDataValues.hospitalsById = hospitalsById;
      newRefDataValues.callNeeds = callNeeds;
      newRefDataValues.orderChanges = orderChanges;
      newRefDataValues.orderChangeById = orderChangeById;
      newRefDataValues.statuses = statuses;
      newRefDataValues.statusById = statusById;

      //get completed calls
      newHomeStateValues.completedCalls = await getCompletedCalls(false);

      //get procedure data
      const { procedures, proceduresById } = await helpers.getProcedureData();
      newRefDataValues.procedures = procedures;
      newRefDataValues.proceduresById = proceduresById;

      //get item data
      const { items, itemsById } = await helpers.getItemsData();

      newRefDataValues.items = items;
      newRefDataValues.itemsById = itemsById;

      //get active calls
      newHomeStateValues.queueItems = await getActiveCalls(false);

      console.log("state updating");

      setAdminState({ ...adminState, ...adminState, ...newHomeStateValues });
      setRefDataState({ ...refDataState, ...newRefDataValues });
    } catch (err) {
      console.log(err);
    }
  };

  const getCompletedCalls = async (newState?: Object): Promise<any> => {
    try {
      let completedCalls: Call[] = await helpers.getCompletedCalls();
      for (let i = 0; i < completedCalls.length; i++) {
        //add nurse name to call for sorting
        if (completedCalls[i].completedBy) {
          completedCalls[i].completedByName =
            refDataState?.usersById![completedCalls[i].completedBy!].fullname;
        } else {
          completedCalls[i].completedByName = undefined;
        }
        //add hospital name to call for sorting
        if (completedCalls[i].hospital) {
          completedCalls[i].hospitalName =
            // @ts-ignore
            refDataState?.hospitalsById![completedCalls[i].hospital!].name;
        } else {
          completedCalls[i].hospitalName = undefined;
        }
      }
      if (newState) {
        return setAdminState({
          ...adminState,
          ...adminState,
          ...newState,
          completedCalls,
        });
      }
      return completedCalls;
    } catch (err) {
      console.log(err);
    }
  };

  const getActiveCalls = async (newState?: Object) => {
    try {
      let activeCalls = await helpers.getActiveCalls();
      if (newState)
        return setAdminState({
          ...adminState,
          ...adminState,
          ...newState,
          queueItems: activeCalls,
        });
      return activeCalls;
    } catch (err) {
      console.log(err);
    }
  };

  const toggleHide = () => {
    setAdminState({ ...adminState, hideUI: !adminState.hideUI });
  };

  const hidingUI = () => {
    console.log("hiding ui");
    setAdminState({ ...adminState, hideUI: true });
  };

  const closeRecordCallback = (shouldDelete?: boolean) => {
    let queueItems = adminState.queueItems;
    if (shouldDelete) {
      queueItems = queueItems.filter(
        (item) => item._id !== adminState.activeCall?._id
      );
    }

    axios
      .post("/api/main", {
        _id: adminState.activeCall?._id,
        path: "/set-as-done-editing",
      })
      .then(() => {
        setAdminState({
          ...adminState,
          activeCall: undefined,
          activeTab: "queue",
          queueItems,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const refreshUserSession = () => {
    console.log("update last login");
    setLastLogin(Math.floor(Date.now() / 1000));
  };

  const loginCallback = (user: User) => {
    if (user.isActive)
      return setAdminState({
        ...adminState,
        user,
      });

    alert("You are no longer an active user. Please contact admin.");
  };

  const startSessionInterval = () => {
    console.log("start session interval");
    sessionInterval.current = setInterval(() => {
      checkUserSession();
    }, 90000); //check session every 15 minutes for inactivity
  };

  const stopSessionInterval = () => {
    console.log("stop session interval");
    clearInterval(sessionInterval.current);
  };

  const checkUserSession = () => {
    if (!adminState.user) return;
    let currentTime = Math.floor(Date.now() / 1000);
    let timeDiff = currentTime - lastLogin;
    console.log(
      `${Math.floor(timeDiff / 60)} minutes inactive (ends session at 60)`
    );
    if (timeDiff > 3419) {
      setModalState({
        ...modalState,
        content: {
          title: "Session Is About To End",
          message:
            'You are about to be logged out due to inactivity. Click "OK" to continue session.',
        },
        confirmation: true,
      });
    }
    if (timeDiff > 3600) {
      console.log("Logging user out due to inactivity");
      logout();
    }
  };

  const seedProcedures = () => {
    axios
      .post("/api/main", { path: "/seed-procedures" })
      .then((resp) => {
        if (resp.data.error || resp.data._message) {
          alert(resp.data.error ? resp.data.error : resp.data._message);
        } else {
          setRefDataState({ ...refDataState, procedures: resp.data });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const seedOptions = () => {
    axios
      .post("/seed-options")
      .then((resp) => {
        if (resp.data.error || resp.data._message) {
          alert(resp.data.error ? resp.data.error : resp.data._message);
        } else {
          setRefDataState({ ...refDataState, options: resp.data });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const seedItems = () => {
    axios
      .post("/seed-items")
      .then((resp) => {
        // console.log(resp.data);
        if (resp.data.error || resp.data._message) {
          alert(resp.data.error ? resp.data.error : resp.data._message);
        } else {
          // console.log(resp.data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const closeMenu = () => {
    setAdminState({ ...adminState, menuIsVisible: false });
  };

  const addUser = () => {
    if (userIsValidated()) {
      axios
        .post("/add-user", {
          fullname: adminState.addFullName,
          username: adminState.addUserName?.toLowerCase(),
          password: adminState.addPassword?.toLowerCase(),
          role: adminState.addAdminAccess ? "admin" : "user",
        })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            alert(resp.data.error ? resp.data.error : resp.data._message);
          } else {
            let users = refDataState.users;
            users.push(resp.data);
            setAdminState({
              ...adminState,
              addFullName: "",
              addUserName: "",
              addPassword: "",
              addAdminAccess: false,
            });
            setRefDataState({ ...refDataState, ...users });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const toggleMainMenu = () => {
    setAdminState({ ...adminState, menuIsVisible: !adminState.menuIsVisible });
  };

  const userIsValidated = () => {
    let errors: string[] = [];

    if (adminState.addUserName!.length < 5) {
      errors.push("- Username must be at least 5 characters long");
    }
    if (adminState.addPassword!.length < 4) {
      errors.push("- Password must be at least 4 characters long");
    }
    if (adminState.addFullName!.length < 5) {
      errors.push("- Full Name must be at least 5 characters long");
    }

    if (errors.length) {
      setModalState({
        ...modalState,
        content: {
          title: "Validation Failed",
          message: errors.join("\n"),
        },
      });
      return false;
    }
    return true;
  };

  const deleteUser = (id: string) => {
    axios
      .post("/delete-user", { _id: id })
      .then(async (resp) => {
        console.log("user deleted");
        if (resp.data.error || resp.data._message) {
          alert(resp.data.error ? resp.data.error : resp.data._message);
        } else {
          let { users, usersById } = await helpers.adminGetAllUsers();
          setRefDataState({ ...refDataState, users, usersById });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const sortColumn = (field: string) => {
    let users = refDataState.users;
    users.sort((a: any, b: any) => {
      return a[field] > b[field] ? 1 : -1;
    });
    setRefDataState({ ...refDataState, users });
  };

  const logout = () => {
    stopSessionInterval();
    setAdminState({ ...HomeStateDefault, ...AdminStateDefault });
  };

  const seedSuper = () => {
    axios
      .post("/seed-super")
      .then((resp) => {
        // console.log(resp.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const returnedCalls = (callsAndAggObj: any) => {
    let queriedCalls = callsAndAggObj.calls;
    let itemsAggregation = callsAndAggObj.aggregation;
    for (let i = 0; i < queriedCalls.length; i++) {
      if (queriedCalls[i].completedBy !== undefined) {
        queriedCalls[i].completedByName =
          refDataState.usersById![queriedCalls[i].completedBy].fullname;
      } else {
        queriedCalls[i].completedByName = undefined;
      }
      //add hospital name to call for sorting
      if (queriedCalls[i].hospital !== undefined) {
        queriedCalls[i].hospitalName =
          refDataState.hospitalsById![queriedCalls[i].hospital].name;
      } else {
        queriedCalls[i].hospitalName = undefined;
      }
    }

    //UPDATE
    let insertionAgg: any = [];
    itemsAggregation.forEach((item: any, idx: number) => {
      switch (
        item._id //Item IDs for Insertion Procedures
      ) {
        case 58:
        case 59:
        case 60:
        case 61:
        case 62:
        case 90:
          insertionAgg.push({
            index: idx,
            itemId: item._id,
            count: itemsAggregation[idx].count,
          });
          break;
        default:
      }
    });

    setAdminState({ ...adminState, queriedCalls, insertionAgg });
  };

  const addInputChange = (
    fieldName: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setAdminState({ ...adminState, [fieldName]: e.target.value });
  };

  const addHospital = () => {
    if (
      adminState.addHospitalName &&
      adminState.addHospitalName.trim().length > 3
    ) {
      axios
        .post("/add-hospital", {
          hospitalName: adminState.addHospitalName,
        })
        .then(async (resp) => {
          if (resp.data.error || resp.data._message) {
            alert(resp.data.error ? resp.data.error : resp.data._message);
          } else {
            const { options } = await helpers.getOptionsData();
            setRefDataState({ ...refDataState, options });
            setAdminState({ ...adminState, addHospitalName: undefined });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setModalState({
        ...modalState,
        content: {
          title: "Hospital Name Too Short",
          message: "Hospital name must be at least 4 characters or longer",
        },
      });
    }
  };

  const addOrderChange = () => {
    if (adminState.addOrderChangeName!.trim().length > 3) {
      axios
        .post("/add-order-change", {
          orderChangeName: adminState.addOrderChangeName,
        })
        .then(async (resp) => {
          if (resp.data.error || resp.data._message) {
            alert(resp.data.error ? resp.data.error : resp.data._message);
          } else {
            const { options } = await helpers.getOptionsData();
            setRefDataState({ ...refDataState, options });
            setAdminState({ ...adminState, addOrderChangeName: undefined });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setModalState({
        ...modalState,
        content: {
          title: "Order Change Name Too Short",
          message: "Order change name must be at least 4 characters or longer",
        },
      });
    }
  };

  const addNeed = () => {
    if (adminState.addNeedName!.trim().length > 1) {
      axios
        .post("/add-need-option", {
          addNeedName: adminState.addNeedName,
        })
        .then(async (resp) => {
          if (resp.data.error || resp.data._message) {
            alert(resp.data.error ? resp.data.error : resp.data._message);
          } else {
            const { options } = await helpers.getOptionsData();
            setRefDataState({ ...refDataState, options });
            setAdminState({ ...adminState, addNeedName: undefined });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setModalState({
        ...modalState,
        content: {
          title: "Need Name Is Too Short",
          message: "Need name must be at least 1 character or longer",
        },
      });
    }
  };

  const editCompletedCall = (callId: string) => {
    if (!adminState.user) return;
    helpers
      .getCallById(callId, adminState.user.userId)
      .then((resp: any) => {
        setAdminState({
          ...adminState,
          activeCall: resp.data,
          activeTab: "active",
        });
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  const closeModal = () => {
    setModalState({ ...modalState, content: undefined });
  };

  const callRoute = () => {
    if (!adminState.customRoute) return;
    axios
      .post(adminState.customRoute)
      .then((resp) => {
        console.log(resp.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const updateUserData = (
    userId: string,
    field: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    if (field === "username" || field === "password") {
      e.target.value = e.target.value.replace(/\s/g, "");
    }
    axios
      .post("/admin-update-user-data", {
        _id: userId,
        field,
        value: e.target.value,
      })
      .then((resp) => {
        if (resp.data.error || resp.data._message) {
          console.log(resp.data);
        } else {
          console.log("user data updated");
          e.target.classList.add("vas-input-success");
          setTimeout((e) => {
            e.target.classList.remove("vas-input-success");
          }, 1000);
        }
      })
      .catch((err) => {
        alert(
          "There was an error while trying to update user. Check developer console for details or contact admin."
        );
        console.log(err);
      });
  };

  const toggleActive = (user: User) => {
    axios
      .post("/toggle-user-is-active", { _id: user._id })
      .then((resp) => {
        if (resp.data.error || resp.data._message) {
          alert(resp.data);
          console.log(resp.data);
        } else {
          let users = refDataState.users;
          users.forEach((user) => {
            if (user._id === resp.data._id) {
              user.isActive = !user.isActive;
            }
          });
          setRefDataState({ ...refDataState, users });
          console.log("toggled user is active");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const togglePasswordVisibility = (e: React.MouseEvent<HTMLSpanElement>) => {
    const target = e.currentTarget.nextSibling as HTMLInputElement;
    if (!target) return;
    if (target.type === "password") {
      target.type = "text";
    } else {
      target.type = "password";
    }
  };

  const reverseUserSort = () => {
    let users = refDataState.users;
    users.reverse();
    setRefDataState({ ...refDataState, users });
  };

  const adminUsernameOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAdminState({
      ...adminState,
      adminUsername: e.target.value.replace(/\s/g, ""),
    });
  };

  const adminPasswordOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAdminState({
      ...adminState,
      adminPassword: e.target.value.replace(/\s/g, ""),
    });
  };

  const adminNewPasswordOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAdminState({
      ...adminState,
      adminNewPassword: e.target.value.replace(/\s/g, ""),
    });
  };

  const adminNewPasswordConfirmOnChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setAdminState({
      ...adminState,
      adminNewPasswordConfirm: e.target.value.replace(/\s/g, ""),
    });
  };

  const updateAdminPassword = () => {
    axios
      .post("/update-admin-password", {
        username: adminState.adminUsername,
        password: adminState.adminPassword,
        newPassword: adminState.adminNewPassword,
      })
      .then((resp) => {
        console.log(resp.data);
        if (resp.data.error || resp.data._message) {
          alert(resp.data.error || resp.data._message);
        } else {
          alert("password successfully updated");
          setAdminState({
            ...adminState,
            updateAdminPassword: false,
            adminUsername: undefined,
            adminPassword: undefined,
            adminNewPassword: undefined,
            adminNewPasswordConfirm: undefined,
          });
        }
        console.log(resp.data);
      })
      .catch((err) => {
        alert(
          "Error updating admin password. Check developer console for details."
        );
        console.log(err);
      });
  };

  const updateModalState = (modalObj: Object) => {
    setModalState({ ...modalState, ...modalObj });
  };

  const getModalConfirmation = () => {
    setModalState({ ...modalState, ...ModalStateDefault });
  };

  const updateCompletedCalls = (calls: Call[]) => {
    setAdminState({ ...adminState, completedCalls: calls });
  };

  const saveActiveCall = (record: Call | undefined) => {
    if (!record) return setAdminState({ ...adminState, activeCall: record });
    let activeCall = { ...record };
    activeCall.updatedBy = adminState.user?.userId!;
    activeCall.updatedAt = new Date().toISOString();
    axios
      .post("/api/main", {
        call: activeCall,
        path: "/save-call",
      })
      .then((resp) => {
        if (resp.data.error || resp.data._message) {
          console.log(resp.data);
        } else {
          console.log("active call saved");
          setAdminState({ ...adminState, activeCall });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const isAdmin = adminState.user?.role === "admin" ? true : false;

  if (!adminState.user)
    return (
      <Login
        getModalConfirmation={getModalConfirmation}
        closeModal={closeModal}
        modalState={modalState}
        loginType={"user"}
        loginCallback={loginCallback}
      />
    );

  if (!refDataState) return <div>Loading...</div>;

  return (
    <RefData.Provider value={refDataState}>
      <div className="vas-admin-container">
        {adminState.user && isAdmin && (
          <div className="vas-admin-main-container">
            <header className="vas-main-header">
              <div className="vas-header-left-container">
                <h2 className="vas-admin-main-title">VAS Admin</h2>
                <p className="vas-admin-menu-toggle" onClick={toggleMainMenu}>
                  Menu &#9660;
                </p>
                <ul
                  className={
                    "vas-admin-menu " +
                    (adminState.menuIsVisible ? "vas-admin-menu-visible" : "")
                  }
                  onClick={closeMenu}
                >
                  <li
                    className="vas-admin-menu-item"
                    data-isactive={
                      adminState.activeTab === "query" ? true : false
                    }
                    onClick={(e) => {
                      setAdminState({ ...adminState, activeTab: "query" });
                    }}
                  >
                    Query
                  </li>
                  {adminState.activeCall && (
                    <li
                      className="vas-admin-menu-item"
                      data-isactive={
                        adminState.activeTab === "active" ? true : false
                      }
                      onClick={(e) => {
                        setAdminState({ ...adminState, activeTab: "active" });
                      }}
                    >
                      Active
                    </li>
                  )}
                  <li
                    className="vas-admin-menu-item"
                    data-isactive={
                      adminState.activeTab === "users" ? true : false
                    }
                    onClick={(e) => {
                      setAdminState({ ...adminState, activeTab: "users" });
                    }}
                  >
                    Users
                  </li>
                  <li
                    className="vas-admin-menu-item"
                    data-isactive={
                      adminState.activeTab === "options" ? true : false
                    }
                    onClick={(e) => {
                      setAdminState({ ...adminState, activeTab: "options" });
                    }}
                  >
                    Options
                  </li>
                  {adminState.user.role === "super" && (
                    <li
                      className="vas-admin-menu-item"
                      data-isactive={
                        adminState.activeTab === "super" ? true : false
                      }
                      onClick={(e) => {
                        setAdminState({ ...adminState, activeTab: "super" });
                      }}
                    >
                      Super
                    </li>
                  )}
                </ul>
                {adminState.menuIsVisible && (
                  <div
                    className="vas-menu-clickguard"
                    onClick={closeMenu}
                  ></div>
                )}
              </div>
              <div className="vas-header-right-container">
                <p className="vas-admin-username vas-capitalize">
                  {adminState.user.fullname}
                </p>
                <p className="vas-admin-logout" onClick={logout}>
                  Logout
                </p>
              </div>
            </header>
            <div className="vas-admin-main-content">
              <div
                className="vas-admin-page-container vas-admin-date-container"
                data-isactive={adminState.activeTab === "query" ? true : false}
              >
                <Filters
                  hideUI={hidingUI}
                  shouldHideUI={adminState.hideUI}
                  toggleHideUI={toggleHide}
                />
                {adminState.queriedCalls.length > 0 && (
                  <ReturnedProcedures
                    user={adminState.user}
                    completedCalls={adminState.completedCalls}
                    editCompletedCall={editCompletedCall}
                    updateCompletedCalls={updateCompletedCalls}
                  />
                )}
              </div>
              <div
                className="vas-admin-page-container vas-admin-active-container"
                data-isactive={adminState.activeTab === "active" ? true : false}
              >
                {adminState.activeCall && adminState.procedures && (
                  <EditProcedure
                    modalState={modalState}
                    updateModalState={updateModalState}
                    closeModal={closeModal}
                    activeCall={adminState.activeCall}
                    closeRecordCallback={closeRecordCallback}
                    user={adminState.user}
                    refreshUserSession={refreshUserSession}
                    saveActiveCall={saveActiveCall}
                  />
                )}
              </div>
              <div
                className="vas-admin-page-container vas-admin-users-container"
                data-isactive={adminState.activeTab === "users" ? true : false}
              >
                <div className="vas-admin-add-user-container">
                  <h3 className="vas-admin-h3">Add User</h3>
                  <label>User's Full Name:</label>
                  <input
                    type="text"
                    placeholder="example: Brett Connolly"
                    value={adminState.addFullName}
                    onChange={(e) => {
                      setAdminState({
                        ...adminState,
                        addFullName: e.target.value,
                      });
                    }}
                  />
                  <label>Username (No Spaces Allowed):</label>
                  <input
                    type="text"
                    placeholder="example: kitty453"
                    value={adminState.addUserName}
                    onChange={(e) => {
                      setAdminState({
                        ...adminState,
                        addUserName: e.target.value.replace(/\s/g, ""),
                      });
                    }}
                  />
                  <label>Password or PIN (No Spaces Allowed):</label>
                  <input
                    type="text"
                    placeholder="example: hello123 or 1542"
                    value={adminState.addPassword}
                    onChange={(e) => {
                      setAdminState({
                        ...adminState,
                        addPassword: e.target.value.replace(/\s/g, ""),
                      });
                    }}
                  />
                  <label>Allow admin access?</label>
                  <input
                    type="checkbox"
                    className="vas-admin-allow-admin-access-dropdown"
                    checked={adminState.addAdminAccess}
                    onChange={(e) => {
                      setAdminState({
                        ...adminState,
                        addAdminAccess: Boolean(e.target.value),
                      });
                    }}
                  />
                  <p className="vas-admin-add-user-notes">
                    User ID will automatically be created once new user is added
                    (auto-incrementing)
                  </p>
                  <button className="vas-admin-create-user" onClick={addUser}>
                    Add User
                  </button>
                </div>
                <div className="vas-admin-update-admin-user-container">
                  <h3 className="vas-admin-h3">Update Admin</h3>
                  {!adminState.updateAdminPassword && (
                    <button
                      onClick={(e) => {
                        setAdminState({
                          ...adminState,
                          updateAdminPassword: true,
                        });
                      }}
                    >
                      Update Admin Password
                    </button>
                  )}
                  {adminState.updateAdminPassword && (
                    <div className="vas-admin-update-admin-credentials-container">
                      <div className="vas-admin-update-admin-credentials-old">
                        <h3>Login Credentials</h3>
                        <div>
                          <label>Username:</label>
                          <input
                            value={adminState.adminUsername}
                            onChange={adminUsernameOnChange}
                            type="text"
                          />
                        </div>
                        <div>
                          <label>Password:</label>
                          <input
                            value={adminState.adminPassword}
                            onChange={adminPasswordOnChange}
                            type="password"
                          />
                        </div>
                      </div>
                      <div className="vas-admin-update-admin-credentials-new">
                        <h3>New Password (min length of 5 characters)</h3>
                        <div>
                          <label>New Password:</label>
                          <input
                            value={adminState.adminNewPassword}
                            onChange={adminNewPasswordOnChange}
                            type="password"
                          />
                        </div>
                        <div>
                          <label>Retype New Password:</label>
                          <input
                            value={adminState.adminNewPasswordConfirm}
                            onChange={adminNewPasswordConfirmOnChange}
                            type="password"
                          />
                        </div>
                      </div>
                      {adminState.adminNewPassword &&
                        adminState.adminNewPasswordConfirm &&
                        adminState.adminNewPassword ===
                          adminState.adminNewPasswordConfirm && (
                          <button onClick={updateAdminPassword}>
                            Update Admin Password
                          </button>
                        )}
                    </div>
                  )}
                </div>
                <div className="vas-admin-remove-user-container">
                  <h3 className="vas-admin-h3">Modify Users</h3>
                  <p className="vas-admin-add-user-notes">
                    Click on table header to sort by field
                  </p>
                  <button
                    className="vas-admin-reverse-sort-users"
                    onClick={(e) => {
                      reverseUserSort();
                    }}
                  >
                    Reverse Sort
                  </button>
                  <table className="vas-admin-table">
                    <tbody>
                      <tr>
                        <th
                          onClick={(e) => {
                            sortColumn("userId");
                          }}
                        >
                          userId
                        </th>
                        <th
                          onClick={(e) => {
                            sortColumn("fullname");
                          }}
                        >
                          fullname
                        </th>
                        <th
                          onClick={(e) => {
                            sortColumn("username");
                          }}
                        >
                          username
                        </th>
                        <th
                          onClick={(e) => {
                            sortColumn("password");
                          }}
                        >
                          password/pin
                        </th>
                        <th
                          onClick={(e) => {
                            sortColumn("role");
                          }}
                        >
                          role
                        </th>
                        <th
                          onClick={(e) => {
                            sortColumn("isActive");
                          }}
                          className="vas-admin-delete-user"
                        >
                          Is Active?
                        </th>
                      </tr>
                      {refDataState.users &&
                        refDataState.users.map((user, idx) => {
                          return (
                            <tr key={user._id}>
                              <td>{user.userId}</td>
                              <td className="vas-capitalize">
                                {user.role === "user" && (
                                  <span>
                                    <DebounceInput
                                      className="vas-admin-update-fullname-input vas-input vas-capitalize"
                                      debounceTimeout={300}
                                      value={user.fullname}
                                      onChange={(e) => {
                                        updateUserData(user._id, "fullname", e);
                                      }}
                                    />
                                  </span>
                                )}
                                {user.role !== "user" && (
                                  <span>{user.fullname}</span>
                                )}
                              </td>
                              <td>
                                {user.role === "user" && (
                                  <span>
                                    <DebounceInput
                                      className="vas-admin-update-username-input vas-input"
                                      debounceTimeout={300}
                                      value={user.username}
                                      onChange={(e) => {
                                        updateUserData(user._id, "username", e);
                                      }}
                                    />
                                  </span>
                                )}
                                {user.role !== "user" && (
                                  <span>{user.username}</span>
                                )}
                              </td>
                              <td>
                                {user.role !== "admin" &&
                                  user.role !== "super" && (
                                    <span className="vas-admin-manage-users-pw">
                                      <span onClick={togglePasswordVisibility}>
                                        &#128065;
                                      </span>
                                      <DebounceInput
                                        className="vas-admin-update-password-input vas-input"
                                        type="password"
                                        debounceTimeout={300}
                                        value={user.password}
                                        onChange={(e) => {
                                          updateUserData(
                                            user._id,
                                            "password",
                                            e
                                          );
                                        }}
                                      />
                                    </span>
                                  )}
                              </td>
                              <td>{user.role}</td>
                              <td className="vas-admin-delete-user">
                                {user.role !== "admin" &&
                                  user.role !== "super" && (
                                    <span>
                                      <input
                                        type="checkbox"
                                        id={user.username}
                                        className="vas-checkbox-select"
                                        defaultChecked={user.isActive}
                                        onChange={(e) => {
                                          toggleActive(user);
                                        }}
                                      />
                                      <label
                                        className={
                                          "vas-btn vas-admin-active-btn " +
                                          (!user.isActive
                                            ? "vas-admin-active-btn-inactive"
                                            : "")
                                        }
                                        htmlFor={user.username}
                                      >
                                        {user.isActive ? "Active" : "Inactive"}
                                      </label>
                                    </span>
                                  )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div
                className="vas-admin-page-container vas-admin-options-container"
                data-isactive={
                  adminState.activeTab === "options" ? true : false
                }
              >
                <h3 className="vas-admin-h3">Modify Options</h3>
                <div className="vas-admin-options-hospitals-container">
                  <h4>Manage Hospital Names</h4>
                  <div className="vas-block-container">
                    <input
                      className="vas-block-input"
                      type="text"
                      value={adminState.addHospitalName}
                      onChange={(e) => {
                        addInputChange("addHospitalName", e);
                      }}
                    />
                    <button className="vas-block-button" onClick={addHospital}>
                      Add Hospital
                    </button>
                  </div>
                  <table className="vas-admin-list-table">
                    <tbody>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                      </tr>
                      {refDataState.options.map((option) => {
                        return (
                          <tr key={option.id}>
                            <td>{option.id}</td>
                            <td>{option.name}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <hr></hr>
                <div className="vas-admin-options-order-change-container">
                  <h4>Manage Order Change Options</h4>
                  <div className="vas-admin-order-change-input-container vas-block-container">
                    <input
                      className="vas-block-input"
                      type="text"
                      value={adminState.addOrderChangeName}
                      onChange={(e) => {
                        addInputChange("addOrderChangeName", e);
                      }}
                    />
                    <button
                      className="vas-admin-order-change-input-submit vas-block-button"
                      onClick={addOrderChange}
                    >
                      Add Order Change
                    </button>
                  </div>
                  <table className="vas-admin-list-table">
                    <tbody>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                      </tr>
                      {refDataState.orderChanges?.options?.map(
                        (option, idx) => {
                          return (
                            <tr key={option.id}>
                              <td>{option.id}</td>
                              <td>{option.name}</td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
                <hr></hr>
                <div className="vas-admin-options-order-change-container">
                  <h4>Manage Add Call 'Need' Options</h4>
                  <div className="vas-admin-order-change-input-container vas-block-container">
                    <input
                      className="vas-block-input"
                      type="text"
                      value={adminState.addNeedName}
                      onChange={(e) => {
                        addInputChange("addNeedName", e);
                      }}
                    />
                    <button
                      className="vas-admin-order-change-input-submit vas-block-button"
                      onClick={addNeed}
                    >
                      Add Need Option
                    </button>
                  </div>
                  <table className="vas-admin-list-table">
                    <tbody>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                      </tr>
                      {refDataState.callNeeds?.options?.map((option, idx) => {
                        return (
                          <tr key={option.id}>
                            <td>{option.id}</td>
                            <td>{option.name}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {adminState.user.role === "super" && (
                <div
                  className="vas-admin-page-container vas-admin-super-container"
                  data-isactive={
                    adminState.activeTab === "super" ? true : false
                  }
                >
                  <h3 className="vas-admin-h3">Super Page</h3>
                  <button onClick={seedProcedures}>Seed Procedures</button>
                  <button onClick={seedOptions}>Seed Options</button>
                  <button onClick={seedItems}>Seed Items</button>
                  <div className="vas-admin-custom-route">
                    <input
                      className="vas-input"
                      value={adminState.customRoute}
                      onChange={(e) => {
                        setAdminState({
                          ...adminState,
                          customRoute: e.target.value,
                        });
                      }}
                      type="text"
                    />
                    <button onClick={callRoute}>Call Route</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {modalState.content && (
          <Modal
            modalState={modalState}
            getConfirmation={getModalConfirmation}
            user={adminState.user}
            closeModal={closeModal}
          />
        )}
      </div>
    </RefData.Provider>
  );
};

export default Admin;
