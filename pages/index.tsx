import type { NextPage } from "next";
import axios from "axios";
import {
  ChangeEvent,
  createContext,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { getItemFromStorage, setStorageItem } from "../util/storage";
import Login from "../components/Login";
import UpdateTimer from "../components/UpdateTimer";
import Queue from "../components/Queue";
import EditProcedure from "../components/EditProcedure";
import LineProcedures from "../components/LineProcedures";
import Modal from "../components/Modal";
import { ModalState, ModalStateDefault } from "../types/ModalState.type";
import ReturnedProcedures from "../components/ReturnedProcedures";
import { User } from "../types/User.type";
import helpers from "../util/helpers";
import { Call } from "../types/Call.type";
import { RefData as RefDataType, RefDataDefault } from "../types/RefData.type";
import { HomeState, HomeStateDefault } from "../types/HomeState.type";
import Header from "../components/Header";

export const RefData = createContext<RefDataType>(RefDataDefault);

const Home: NextPage = () => {
  const tabRefreshQueue = useRef<HTMLDivElement>(null);
  const tabRefreshCompleted = useRef<HTMLDivElement>(null);
  const tabRefreshOpen = useRef<HTMLDivElement>(null);

  const sessionInterval = useRef<undefined | ReturnType<typeof setInterval>>(
    undefined
  );

  const [lastLogin, setLastLogin] = useState(Date.now());
  const [refDataState, setRefDataState] = useState<RefDataType>(RefDataDefault);
  const [homeState, setHomeState] = useState<HomeState>(HomeStateDefault);
  const [modalState, setModalState] = useState<ModalState>(ModalStateDefault);

  //on component mount/unmount
  useEffect(() => {
    let newHomeState: any = {};
    let user = getItemFromStorage("user");
    let activeTab = getItemFromStorage("activeTab");

    if (user) {
      newHomeState.user = user;
      startSessionInterval();
    }

    if (activeTab) {
      newHomeState.activeTab = activeTab;
    }

    stateLoadCalls(newHomeState);

    return () => {
      clearInterval(sessionInterval.current);
    };
  }, []);

  useEffect(() => {
    console.log({ homeState });
  }, [homeState]);

  useEffect(() => {
    console.log({ refDataState });
  }, [refDataState]);

  useEffect(() => {
    setTab(homeState.activeTab);
  }, [homeState.activeTab]);

  useEffect(() => {
    if (modalState.autoClose) {
      setTimeout(() => resetModal(), 3000);
    }
  }, [modalState]);

  useEffect(() => {
    setStorageItem("user", homeState.user);
    if (homeState.user) {
      setHomeState({
        ...homeState,
        activeCall: homeState?.queueItems?.find(
          (call: Call) => call.openBy === homeState.user?.userId
        ),
      });
      refreshUserSession();
    }
  }, [homeState.user]);

  const updateHomeState = (stateObj: Object) => {
    setHomeState({ ...homeState, ...stateObj });
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

  const refreshUserSession = () => {
    console.log("update last login");
    setLastLogin(Math.floor(Date.now() / 1000));
  };

  const toggleUserAvailability = () => {
    axios
      .post("/api/main", {
        _id: homeState.user?._id,
        path: "/toggle-user-availability",
      })
      .then((resp) => {
        setHomeState({
          ...homeState,
          user: resp.data,
          userMenuVisible: false,
        });
      })
      .catch((err) => {
        addToErrorArray(err);
      });
  };

  const showOnlineUsers = async () => {
    try {
      let response = await helpers.getOnlineUsers();
      setHomeState({
        ...homeState,
        onlineUsersVisible: true,
        userMenuVisible: false,
        onlineUsers: response,
      });
    } catch (err) {
      addToErrorArray(err);
    }
  };

  const hideOnlineUsers = () => {
    setHomeState({ ...homeState, onlineUsersVisible: false });
  };

  const getModalConfirmation = () => {
    resetModal();
  };

  const editCompletedCall = (
    callId: string,
    completedBy: number | undefined,
    dressingChangeDate: Date | undefined
  ) => {
    if (!homeState.user) return;
    let isAdmin =
      homeState.user.role === "admin" || homeState.user.role === "super";
    if (
      isAdmin ||
      homeState.user.userId === completedBy ||
      dressingChangeDate !== null
    ) {
      helpers
        .getCallById(callId, homeState.user.userId)
        .then((resp: Call) => {
          setHomeState({
            ...homeState,
            activeCall: resp,
            activeTab: "open",
          });
        })
        .catch((err: any) => {
          setModalState({
            ...modalState,
            content: {
              title: "Record Is Already Open",
              message: `This record is currently open by ${err.userId}`,
            },
          });
        });
    } else {
      setModalState({
        ...modalState,
        content: {
          title: "Not Allowed To Edit",
          message: "You cannot edit someone else's completed record",
        },
      });
    }
  };

  const updateCompletedCalls = (calls: Call[]) => {
    setHomeState({ ...homeState, completedCalls: calls });
  };

  const closeRecordCallback = (shouldDelete?: boolean) => {
    let queueItems = homeState.queueItems;
    if (shouldDelete) {
      queueItems = queueItems.filter(
        (item) => item._id !== homeState.activeCall?._id
      );
    }

    axios
      .post("/api/main", {
        _id: homeState.activeCall?._id,
        path: "/set-as-done-editing",
      })
      .then(() => {
        setHomeState({
          ...homeState,
          activeCall: undefined,
          activeTab: "queue",
          queueItems,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const checkUserSession = () => {
    if (!homeState.user) return;
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

  const loginCallback = (user: User) => {
    if (user.isActive)
      return setHomeState({
        ...homeState,
        user,
      });

    alert("You are no longer an active user. Please contact admin.");
  };

  const logout = () => {
    stopSessionInterval();
    setHomeState(HomeStateDefault);
  };

  const stateLoadCalls = async (newHomeState: any) => {
    let newRefDataValues: any = {};
    let newHomeStateValues = newHomeState;

    try {
      console.log("trying state load calls");
      //get users
      let { users, usersById } = await helpers.getAllUsers();
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

      setHomeState({ ...homeState, ...newHomeStateValues });
      setRefDataState({ ...refDataState, ...newRefDataValues });
    } catch (err) {
      addToErrorArray(err);
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
          completedCalls[i].completedByName = null;
        }
        //add hospital name to call for sorting
        if (completedCalls[i].hospital) {
          completedCalls[i].hospitalName =
            // @ts-ignore
            refDataState?.hospitalsById![completedCalls[i].hospital!].name;
        } else {
          completedCalls[i].hospitalName = null;
        }
      }
      if (newState) {
        return setHomeState({
          ...homeState,
          ...newState,
          completedCalls,
        });
      }
      return completedCalls;
    } catch (err) {
      addToErrorArray(err);
    }
  };

  const getActiveCalls = async (newState?: Object) => {
    try {
      let activeCalls = await helpers.getActiveCalls();
      if (newState)
        return setHomeState({
          ...homeState,
          ...newState,
          queueItems: activeCalls,
        });
      return activeCalls;
    } catch (err) {
      addToErrorArray(err);
    }
  };

  const setTab = (tab: string) => {
    switch (tab) {
      case "open":
        refreshAnimation(tabRefreshOpen);
        setHomeState({ ...homeState, activeTab: tab });
        break;
      case "complete":
        refreshAnimation(tabRefreshCompleted);
        getCompletedCalls({ activeTab: tab });
        break;
      case "queue":
        refreshAnimation(tabRefreshQueue);
        getActiveCalls({ activeTab: tab });
        break;
      case "lines":
        getOpenLineProcedures();
        break;
    }
  };

  const refreshAnimation = (ref: RefObject<HTMLDivElement>) => {
    const className = "vas-home-refresh-bar-activate";
    ref.current?.classList.add(className);
    setTimeout(() => ref.current?.classList.remove(className), 1000);
  };

  const getOpenLineProcedures = () => {
    helpers
      .getOpenLineProcedures()
      .then((data) => {
        let lineProcedures = data;
        let sortByField = homeState.linesSortBy;
        lineProcedures.sort((a: any, b: any) => {
          if (a[sortByField] > b[sortByField]) return 1;
          if (a[sortByField] < b[sortByField]) return -1;
          return 0;
        });
        setHomeState({
          ...homeState,
          lineProcedures,
          lastUpdateHide: true,
        });
      })
      .catch((err) => {
        addToErrorArray(err);
      });
  };

  const addToErrorArray = (err: any) => {
    console.log("adding to error array");
    let errArr = homeState.errorArr;
    errArr.push(err);
    setHomeState({ ...homeState, errorArr: errArr });
  };

  const closeModal = (modalObj: { call?: Call; modalData?: ModalState }) => {
    if (modalObj.call) {
      let callData = { ...modalObj.call };
      let queueItems = homeState.queueItems;
      queueItems.push(callData);
      setHomeState({
        ...homeState,
        queueItems,
        activeCall: callData.openBy ? callData : homeState.activeCall,
        activeTab: callData.openBy ? "open" : homeState.activeTab,
      });
      setModalState({
        ...modalState,
        ...modalObj.modalData,
      });
    } else {
      resetModal();
    }
  };

  const updateModalState = (modalData: any) => {
    setModalState({ ...setModalState, ...modalData });
  };

  const resetModal = () => {
    setModalState({
      ...modalState,
      content: undefined,
      confirmation: false,
      autoClose: false,
    });
  };

  const selectJob = (call: Call) => {
    if (!homeState.activeCall) {
      if (call.openBy) {
        if (call.openBy !== homeState.user?.userId) {
          setModalState({
            ...modalState,
            content: {
              title: "Record Already Open",
              message: `This record is currently opened by someone else: ${call.openBy} `,
            },
          });
        } else {
          axios
            .post("/api/main", {
              _id: call._id,
              userId: homeState.user?.userId,
              path: "/set-call-as-open",
            })
            .then((resp) => {
              if (resp.data.error || resp.data._message) {
              } else {
                setHomeState({
                  ...homeState,
                  activeCall: call,
                  activeTab: "open",
                });
              }
            })
            .catch((err) => {
              addToErrorArray(err);
            });
        }
      } else {
        axios
          .post("/api/main", {
            _id: call._id,
            userId: homeState.user?.userId,
            path: "/set-call-as-open",
          })
          .then((resp) => {
            if (resp.data.error || resp.data._message) {
            } else {
              setHomeState({
                ...homeState,
                activeCall: resp.data,
                activeTab: "open",
              });
            }
          })
          .catch((err) => {
            addToErrorArray(err);
          });
      }
    } else {
      let tempState: any = {
        activeTab: "open",
      };
      if (call._id !== homeState.activeCall._id) {
        tempState = {
          ...tempState,
          modalIsOpen: true,
          title: "You Have An Open Record",
          message:
            'You already have a record open. Complete it or "Return To Lines Tab" to select a different one.',
        };
      }
      setHomeState({ ...homeState, ...tempState });
    }
  };

  const reverseSort = (arrayToReverse: string) => {
    let lineProcedures = homeState.lineProcedures;
    lineProcedures.reverse();
    switch (arrayToReverse) {
      case "lines":
        setHomeState({ ...homeState, lineProcedures });
        break;
      default:
    }
  };

  const linesSortByOnChange = (e: ChangeEvent<HTMLSelectElement>) => {
    let sortField = e.target.value;
    let lineProcedures = homeState.lineProcedures;
    lineProcedures.sort((a: any, b: any) => {
      if (a[sortField] > b[sortField]) return 1;
      if (a[sortField] < b[sortField]) return -1;
      return 0;
    });
    setHomeState({
      ...homeState,
      linesSortBy: e.target.value,
      lineProcedures,
    });
  };

  const saveActiveCall = (record: Call | undefined) => {
    if (!record) return setHomeState({ ...homeState, activeCall: record });
    let activeCall = { ...record };
    activeCall.updatedBy = homeState.user?.userId!;
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
          setHomeState({ ...homeState, activeCall });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if (!homeState.user)
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
    <>
      <RefData.Provider value={refDataState}>
        {homeState.user && refDataState.usersById && (
          <div className="vas-container-fluid vas-home-container">
            <Header
              updateModalState={updateModalState}
              homeState={homeState}
              updateHomeState={updateHomeState}
              toggleUserAvailability={toggleUserAvailability}
              showOnlineUsers={showOnlineUsers}
              hideOnlineUsers={hideOnlineUsers}
              logout={logout}
            />
            <ul className="vas-home-nav-tabs">
              <li
                className="vas-home-nav-item"
                data-isactive={homeState.activeTab === "queue" ? true : false}
                onClick={() => {
                  setTab("queue");
                }}
              >
                <p className="vas-home-nav-item-text">Queue</p>
                <div
                  className="vas-home-nav-item-refresh-bar"
                  ref={tabRefreshQueue}
                ></div>
              </li>
              <li
                className="vas-home-nav-item"
                data-isactive={
                  homeState.activeTab === "complete" ? true : false
                }
                onClick={() => {
                  setTab("complete");
                }}
              >
                <p className="vas-home-nav-item-text">Completed</p>
                <div
                  className="vas-home-nav-item-refresh-bar"
                  ref={tabRefreshCompleted}
                ></div>
              </li>
              {homeState.activeCall && (
                <li
                  className={
                    "vas-home-nav-item vas-status-" +
                    homeState.activeCall.status
                  }
                  data-isactive={homeState.activeTab === "open" ? true : false}
                  onClick={() => {
                    setTab("open");
                  }}
                >
                  <p className="vas-home-nav-item-text">Open</p>
                  <div
                    className="vas-home-nav-item-refresh-bar"
                    ref={tabRefreshOpen}
                  ></div>
                </li>
              )}
              {!homeState.lastUpdateHide && <UpdateTimer />}
            </ul>
            <div className="vas-home-tabContent">
              <div
                className="vas-home-page-container"
                data-isactive={homeState.activeTab === "queue" ? true : false}
              >
                <Queue
                  queueItems={homeState.queueItems}
                  selectJob={selectJob}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={
                  homeState.activeTab === "complete" ? true : false
                }
              >
                <ReturnedProcedures
                  user={homeState.user}
                  completedCalls={homeState.completedCalls}
                  editCompletedCall={editCompletedCall}
                  updateCompletedCalls={updateCompletedCalls}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={homeState.activeTab === "lines" ? true : false}
              >
                <LineProcedures
                  linesSortByOnChange={linesSortByOnChange}
                  lineProcedures={homeState.lineProcedures}
                  editCompletedCall={editCompletedCall}
                  reverseSort={reverseSort}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={homeState.activeTab === "open" ? true : false}
              >
                {homeState.activeCall && homeState.procedures && (
                  <EditProcedure
                    modalState={modalState}
                    updateModalState={updateModalState}
                    closeModal={closeModal}
                    activeCall={homeState.activeCall}
                    closeRecordCallback={closeRecordCallback}
                    user={homeState.user}
                    refreshUserSession={refreshUserSession}
                    saveActiveCall={saveActiveCall}
                  />
                )}
              </div>
            </div>
            {modalState.content && (
              <Modal
                modalState={modalState}
                getConfirmation={getModalConfirmation}
                user={homeState.user}
                closeModal={closeModal}
              />
            )}
          </div>
        )}
      </RefData.Provider>
    </>
  );
};

export default Home;
