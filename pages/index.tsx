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
import { Modal as ModalType } from "../types/Modal.type";
import ReturnedProcedures from "../components/ReturnedProcedures";
import { User } from "../types/User.type";
import helpers from "../util/helpers";
import { Call } from "../types/Call.type";
import { RefData as RefDataType, RefDataDefault } from "../types/RefData.type";
import { HomeState, HomeStateDefault } from "../types/HomeState.type";

export const RefData = createContext<RefDataType>(RefDataDefault);

const Home: NextPage = () => {
  const tabRefreshQueue = useRef<HTMLDivElement>(null);
  const tabRefreshCompleted = useRef<HTMLDivElement>(null);
  const tabRefreshOpen = useRef<HTMLDivElement>(null);

  const sessionInterval = useRef<undefined | ReturnType<typeof setInterval>>(
    undefined
  );

  const [lastLogin, setLastLogin] = useState(Date.now());
  const [refDataState, setRefDataState] = useState<undefined | RefDataType>(
    undefined
  );
  const [homeState, setHomeState] = useState<HomeState>(HomeStateDefault);
  const [modalState, setModalState] = useState<ModalType>({
    content: undefined,
    confirmation: false,
    autoClose: false,
  });

  //on component mount/unmount
  useEffect(() => {
    let newState: any = {};
    let user = getItemFromStorage("user");
    let activeHomeTab = getItemFromStorage("activeHomeTab");

    if (user) {
      newState.user = user;
      startSessionInterval();
    }

    if (activeHomeTab) {
      newState.activeHomeTab = activeHomeTab;
    }

    setHomeState({ ...homeState, ...newState });

    stateLoadCalls();

    return () => {
      clearInterval(sessionInterval.current);
    };
  }, []);

  useEffect(() => {
    console.log(homeState);
  }, [homeState]);

  useEffect(() => {
    setTab(homeState.activeHomeTab);
  }, [homeState.activeHomeTab]);

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
        activeCall: homeState.queueItems.find(
          (call: Call) => call.openBy === homeState.user?.userId
        ),
      });
      refreshUserSession();
    }
  }, [homeState.user]);

  const resetHomeState = () => {
    setHomeState(HomeStateDefault);
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
    completedBy: number,
    dressingChangeDate: Date
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
            activeHomeTab: "open",
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
      .then((resp) => {
        console.log(resp.data);
        setHomeState({
          ...homeState,
          activeCall: undefined,
          activeHomeTab: "queue",
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
    resetHomeState();
  };

  const stateLoadCalls = async () => {
    let newRefDataValues = RefDataDefault;
    let newHomeStateValues = HomeStateDefault;

    try {
      //get users
      let allUsers = await helpers.getAllUsers();
      newRefDataValues.users = allUsers.usersArr;
      newRefDataValues.usersById = allUsers.usersById;

      //get options data
      let options = await helpers.getOptionsData();
      newRefDataValues.options = options.options;
      newRefDataValues.hospitals = options.hospitals;
      newRefDataValues.hospitalsById = options.hospitalsById;
      newRefDataValues.callNeeds = options.callNeeds;
      newRefDataValues.orderChanges = options.orderChanges;
      newRefDataValues.orderChangeById = options.orderChangeById;
      newRefDataValues.statusById = options.statuses;

      //get completed calls
      newHomeStateValues.completedCalls = await getCompletedCalls(false);

      //get procedure data
      let procedureData = await helpers.getProcedureData();
      newRefDataValues.proceduresById = procedureData.proceduresById;
      newRefDataValues.procedures = procedureData.procedures;

      //get item data
      const { items, itemsById } = await helpers.getItemsData();

      newRefDataValues.items = items;
      newRefDataValues.itemsById = itemsById;

      //get active calls
      newHomeStateValues.queueItems = await getActiveCalls(false);
    } catch (err) {
      addToErrorArray(err);
    }
    setHomeState({ ...homeState, ...newHomeStateValues });
    setRefDataState({ ...refDataState, ...newRefDataValues });
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
        setHomeState({ ...homeState, activeHomeTab: tab });
        break;
      case "complete":
        refreshAnimation(tabRefreshCompleted);
        getCompletedCalls({ activeHomeTab: tab });
        break;
      case "queue":
        refreshAnimation(tabRefreshQueue);
        getActiveCalls({ activeHomeTab: tab });
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

  const addCall = () => {
    setModalState({
      ...modalState,
      content: {
        title: "Add Call",
        message: "",
      },
    });
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
    let errArr = homeState.errorArr;
    errArr.push(err);
    setHomeState({ ...homeState, errorArr: errArr });
  };

  const closeModal = (modalObj: { call?: Call; modalData?: ModalType }) => {
    if (modalObj.call) {
      let callData = { ...modalObj.call };
      let queueItems = homeState.queueItems;
      queueItems.push(callData);
      setHomeState({
        ...homeState,
        queueItems,
        activeCall: callData.openBy ? callData : homeState.activeCall,
        activeHomeTab: callData.openBy ? "open" : homeState.activeHomeTab,
      });
      setModalState({
        ...modalState,
        ...modalObj.modalData,
      });
    } else {
      resetModal();
    }
  };

  const updateModal = (modalData: ModalType) => {
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

  const selectJob = (job: any) => {
    console.log(job);
    if (!homeState.activeCall) {
      if (job.openBy) {
        if (job.openBy !== homeState.user?.userId) {
          setModalState({
            ...modalState,
            content: {
              title: "Record Already Open",
              message: `This record is currently opened by someone else: ${job.openBy} `,
            },
          });
        } else {
          axios
            .post("/api/main", {
              _id: job._id,
              userId: homeState.user?.userId,
              path: "/set-call-as-open",
            })
            .then((resp) => {
              if (resp.data.error || resp.data._message) {
              } else {
                setHomeState({
                  ...homeState,
                  activeCall: job,
                  activeHomeTab: "open",
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
            _id: job._id,
            userId: homeState.user?.userId,
            path: "/set-call-as-open",
          })
          .then((resp) => {
            if (resp.data.error || resp.data._message) {
            } else {
              setHomeState({
                ...homeState,
                activeCall: resp.data,
                activeHomeTab: "open",
              });
            }
          })
          .catch((err) => {
            addToErrorArray(err);
          });
      }
    } else {
      let tempState: any = {
        activeHomeTab: "open",
      };
      if (job._id !== homeState.activeCall._id) {
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
    return <Login loginType={"user"} loginCallback={loginCallback} />;

  if (!refDataState) return <div>Loading...</div>;

  return (
    <>
      <RefData.Provider value={refDataState}>
        {homeState.user && refDataState.usersById && (
          <div className="vas-container-fluid vas-home-container">
            <header className="vas-main-header">
              <div className="vas-header-left-container">
                <h1
                  className="vas-home-header-title vas-pointer"
                  onClick={(e) => {
                    window.location.reload();
                  }}
                >
                  Salubrity
                </h1>
                <button
                  className="vas-button vas-home-add-call"
                  onClick={addCall}
                >
                  Add Call
                </button>
              </div>
              <div className="vas-header-right-container">
                <span
                  title={homeState.user.isAvailable ? "Available" : "Offline"}
                  className={
                    "vas-home-status-dot " +
                    (!homeState.user.isAvailable ? "vas-user-offline" : "")
                  }
                ></span>
                <span className="vas-home-main-header-user-container">
                  <p
                    className="vas-home-main-header-user vas-nowrap"
                    onClick={(e) => {
                      setHomeState({
                        ...homeState,
                        userMenuVisible: !homeState.userMenuVisible,
                      });
                    }}
                  >
                    {homeState.user.fullname}
                    <b>&#9660;</b>
                  </p>
                  {homeState.userMenuVisible && (
                    <span>
                      <div
                        className="vas-home-clickguard"
                        onClick={(e) => {
                          setHomeState({
                            ...homeState,
                            userMenuVisible: false,
                          });
                        }}
                      ></div>
                      <ul className="vas-home-user-menu">
                        <li onClick={toggleUserAvailability}>
                          {homeState.user.isAvailable
                            ? "Go 'Offline'"
                            : "Go 'Online'"}
                        </li>
                        <li onClick={showOnlineUsers}>Show Online Users</li>
                      </ul>
                    </span>
                  )}
                </span>
                <button
                  className="vas-home-main-header-logout"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
              <div
                className={
                  "vas-home-online-users " +
                  (homeState.onlineUsersVisible
                    ? "vas-home-show-online-users"
                    : "")
                }
              >
                <p
                  className="vas-home-hide-online-users"
                  onClick={hideOnlineUsers}
                >
                  &times;
                </p>
                <div className="vas-home-online-users-list">
                  <p className="vas-home-online-users-title">
                    Available Users:
                  </p>
                  {homeState.onlineUsers.map((username, idx) => {
                    return (
                      <p
                        key={username + "" + idx}
                        className="vas-capitalize vas-home-online-users-user"
                      >
                        {username}
                      </p>
                    );
                  })}
                </div>
              </div>
              {homeState.onlineUsersVisible && (
                <div
                  className="vas-home-clickguard"
                  onClick={(e) => {
                    setHomeState({ ...homeState, onlineUsersVisible: false });
                  }}
                ></div>
              )}
            </header>
            <ul className="vas-home-nav-tabs">
              <li
                className="vas-home-nav-item"
                data-isactive={
                  homeState.activeHomeTab === "queue" ? true : false
                }
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
                  homeState.activeHomeTab === "complete" ? true : false
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
              {/* <li className='vas-home-nav-item' data-isactive={homeState.activeHomeTab === 'lines' ? true : false} onClick={e=>{setTab('lines', e)}}>
                <p className='vas-home-nav-item-text'>Lines</p>
                <div className='vas-home-nav-item-refresh-bar'></div>
              </li> */}
              {homeState.activeCall && (
                <li
                  className={
                    "vas-home-nav-item vas-status-" +
                    homeState.activeCall.status
                  }
                  data-isactive={
                    homeState.activeHomeTab === "open" ? true : false
                  }
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
                data-isactive={
                  homeState.activeHomeTab === "queue" ? true : false
                }
              >
                <Queue
                  queueItems={homeState.queueItems}
                  selectJob={selectJob}
                  // hospitalsById={homeState.hospitalsById}
                  // usersById={homeState.usersById}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={
                  homeState.activeHomeTab === "complete" ? true : false
                }
              >
                <ReturnedProcedures
                  completedCalls={homeState.completedCalls}
                  editCompletedCall={editCompletedCall}
                  // hospitalsById={homeState.hospitalsById}
                  // usersById={homeState.usersById}
                  // itemsById={homeState.itemsById}
                  // proceduresById={homeState.proceduresById}
                  // orderChangeById={homeState.orderChangeById}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={
                  homeState.activeHomeTab === "lines" ? true : false
                }
              >
                <LineProcedures
                  linesSortByOnChange={linesSortByOnChange}
                  lineProcedures={homeState.lineProcedures}
                  editCompletedCall={editCompletedCall}
                  reverseSort={reverseSort}
                  // hospitalsById={homeState.hospitalsById}
                  // usersById={homeState.usersById}
                  // itemsById={homeState.itemsById}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={
                  homeState.activeHomeTab === "open" ? true : false
                }
              >
                {homeState.activeCall && homeState.procedures && (
                  <EditProcedure
                    modalState={modalState}
                    updateModal={updateModal}
                    closeModal={closeModal}
                    activeCall={homeState.activeCall}
                    procedures={homeState.procedures}
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
