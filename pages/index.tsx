import type { NextPage } from "next";
import axios from "axios";
import { ChangeEvent, RefObject, useEffect, useRef, useState } from "react";
import { HomeState } from "../types/HomeState.type";
import { getItemFromStorage, setStorageItem } from "../util/storage";
import Login from "../components/Login";
import UpdateTimer from "../components/UpdateTimer";
import Queue from "../components/Queue";
import EditProcedure from "../components/EditProcedure";
import LineProcedures from "../components/LineProcedures";
import Modal from "../components/Modal";
import ReturnedProcedures from "../components/ReturnedProcedures";
import { User } from "../types/User.type";
import helpers from "../util/helpers";

const HomeStateDefault: HomeState = {
  activeHomeTab: "queue",
  activeRecord: undefined,
  allOptions: [],
  allUsers: [],
  callNeeds: undefined,
  completedCalls: [],
  confirmationType: undefined,
  errorArr: [],
  hospitals: undefined,
  hospitalsById: undefined,
  itemsById: undefined,
  lastUpdateHide: false,
  lineProcedures: [],
  linesSortBy: "dressingChangeDate",
  modalConfirmation: false,
  modalIsOpen: false,
  modalMessage: "",
  modalTitle: "",
  onlineUsers: [],
  onlineUsersVisible: false,
  orderChanges: undefined,
  orderChangeById: [],
  procedures: [],
  proceduresById: undefined,
  queueItems: [],
  selectedProcedures: [],
  statusById: undefined,
  user: undefined,
  userMenuVisible: false,
  usersById: undefined,
};

const Home: NextPage = () => {
  const tabRefreshQueue = useRef<HTMLDivElement>(null);
  const tabRefreshCompleted = useRef<HTMLDivElement>(null);
  const tabRefreshOpen = useRef<HTMLDivElement>(null);

  const sessionInterval = useRef<undefined | ReturnType<typeof setInterval>>(
    undefined
  );

  const [lastLogin, setLastLogin] = useState(Date.now());
  const [homeState, setHomeState] = useState(HomeStateDefault);

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

    stateLoadCalls(newState);

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
    setStorageItem("user", homeState.user);
    if (homeState.user) refreshUserSession();
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
      .post("/toggle-user-availability", { _id: homeState.user?._id })
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
      response = await response.json();
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
        .then((resp) => {
          setHomeState({
            ...homeState,
            activeRecord: resp,
            activeHomeTab: "open",
          });
        })
        .catch((err) => {
          setHomeState({
            ...homeState,
            modalTitle: "Record Is Already Open",
            modalMessage: `This record is currently open by ${err.userId}`,
            modalIsOpen: true,
          });
        });
    } else {
      setHomeState({
        ...homeState,
        modalTitle: "Not Allowed To Edit",
        modalMessage: "You cannot edit someone else's completed record",
        modalIsOpen: true,
      });
    }
  };

  const closeRecordCallback = (type: string) => {
    switch (type) {
      case "delete":
        let queueItems = homeState.queueItems;
        for (var i = queueItems.length - 1; i >= 0; i--) {
          if (queueItems[i]._id === homeState.activeRecord._id) {
            queueItems.splice(i, 1);
          }
        }
        setHomeState({ ...homeState, queueItems });
        break;
      default:
        axios
          .post("/api/main", {
            _id: homeState.activeRecord._id,
            path: "/set-as-done-editing",
          })
          .then((resp) => {
            console.log(resp.data);
          })
          .catch((err) => {
            console.log(err);
          });
        break;
    }

    setHomeState({
      ...homeState,
      activeRecord: undefined,
      activeHomeTab: "queue",
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
      setHomeState({
        ...homeState,
        modalTitle: "Session Is About To End",
        modalMessage:
          'You are about to be logged out due to inactivity. Click "OK" to continue session.',
        modalIsOpen: true,
        modalConfirmation: true,
        confirmationType: "end-session",
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

  const stateLoadCalls = async (state: any) => {
    let newState = state;

    try {
      //get users
      let allUsers = await helpers.getAllUsers();
      newState.allUsers = allUsers.usersArr;
      newState.usersById = allUsers.usersById;

      //get options data
      let options = await helpers.getOptionsData();
      newState.allOptions = options.options;
      newState.hospitals = options.hospitals;
      newState.hospitalsById = options.hospitalsById;
      newState.callNeeds = options.callNeeds;
      newState.orderChanges = options.orderChanges;
      newState.orderChangeById = options.orderChangeById;
      newState.statusById = options.statuses;

      //get completed calls
      newState.completedCalls = await getCompletedCalls(false);

      //get procedure data
      let procedureData = await helpers.getProcedureData();
      newState.proceduresById = procedureData.proceduresById;
      newState.procedures = procedureData.procedures;

      //get item data
      let itemData = await helpers.getItemsData();
      newState.itemsById = itemData;

      //get active calls
      let activeCalls = await getActiveCalls(false);
      newState.queueItems = activeCalls;

      //get open call for user
      let openCall = await helpers.getOpenCallForUser(homeState.user?.userId);
      newState.activeRecord = openCall;
    } catch (err) {
      addToErrorArray(err);
    }
    setHomeState({ ...homeState, ...newState });
  };

  const getCompletedCalls = async (newState?: Object) => {
    try {
      let completedCalls = await helpers.getCompletedCalls();
      let calls: any[] = completedCalls;
      for (let i = 0; i < calls.length; i++) {
        //add nurse name to call for sorting
        if (calls[i].completedBy) {
          calls[i].completedByName =
            homeState.usersById![calls[i].completedBy].fullname;
        } else {
          calls[i].completedByName = null;
        }
        //add hospital name to call for sorting
        if (calls[i].hospital) {
          calls[i].hospitalName =
            homeState.hospitalsById![calls[i].hospital].name;
        } else {
          calls[i].hospitalName = null;
        }
      }
      if (newState) {
        return setHomeState({
          ...homeState,
          ...newState,
          completedCalls: calls,
        });
      }
      return calls;
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
    setHomeState({
      ...homeState,
      modalTitle: "Add Call",
      modalIsOpen: true,
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

  const toggleHandler = () => {
    setHomeState({
      ...homeState,
      modalIsOpen: !homeState.modalIsOpen,
    });
  };

  const closeModal = (callDataReturned: any) => {
    let callData = callDataReturned;
    if (callData) {
      let queueItems = homeState.queueItems;
      queueItems.push(callData);
      setHomeState({
        ...homeState,
        queueItems,
        modalTitle: "Call Was Added",
        modalMessage: "Your call was added to the queue!",
        activeRecord: callData.openBy ? callData : homeState.activeRecord,
        activeHomeTab: callData.openBy ? "open" : homeState.activeHomeTab,
      });
      setTimeout(() => {
        resetModal();
      }, 2000);
    } else {
      resetModal();
    }
  };

  const resetModal = () => {
    setHomeState({
      ...homeState,
      modalIsOpen: false,
      modalMessage: "",
      modalTitle: "",
      modalConfirmation: false,
      confirmationType: undefined,
    });
  };

  const selectJob = (job: any) => {
    if (!homeState.activeRecord) {
      if (job.openBy) {
        if (job.openBy === homeState.user?.userId) {
          setHomeState({ ...homeState, activeRecord: job });
        } else {
          setHomeState({
            ...homeState,
            modalIsOpen: true,
            modalTitle: "Record Already Open",
            modalMessage: `This record is currently opened by someone else: ${job.openBy} `,
          });
        }
      } else {
        axios
          .post("/set-call-as-open", {
            _id: job._id,
            userId: homeState.user?.userId,
          })
          .then((resp) => {
            if (resp.data.error || resp.data._message) {
            } else {
              setHomeState({
                ...homeState,
                activeRecord: resp.data,
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
      if (job._id !== homeState.activeRecord._id) {
        tempState = {
          ...tempState,
          modalIsOpen: true,
          modalTitle: "You Have An Open Record",
          modalMessage:
            'You already have a record open. Complete it or "Return To Queue" to select a different one.',
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
    lineProcedures.sort((a, b) => {
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

  if (!homeState.user)
    return <Login loginType={"user"} loginCallback={loginCallback} />;

  return (
    <div>
      {homeState.user && homeState.usersById && (
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
                        setHomeState({ ...homeState, userMenuVisible: false });
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
              <button className="vas-home-main-header-logout" onClick={logout}>
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
                <p className="vas-home-online-users-title">Available Users:</p>
                {homeState.onlineUsers.map((username, idx) => {
                  return (
                    <p
                      key={username + idx}
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
              data-isactive={homeState.activeHomeTab === "queue" ? true : false}
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
            {homeState.activeRecord && (
              <li
                className={
                  "vas-home-nav-item vas-status-" +
                  homeState.activeRecord.status
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
              data-isactive={homeState.activeHomeTab === "queue" ? true : false}
            >
              <Queue
                queueItems={homeState.queueItems}
                hospitalsById={homeState.hospitalsById}
                usersById={homeState.usersById}
                selectJob={selectJob}
              />
            </div>
            <div
              className="vas-home-page-container"
              data-isactive={
                homeState.activeHomeTab === "complete" ? true : false
              }
            >
              <ReturnedProcedures
                queriedProcedures={homeState.completedCalls}
                hospitalsById={homeState.hospitalsById}
                usersById={homeState.usersById}
                itemsById={homeState.itemsById}
                proceduresById={homeState.proceduresById}
                editCompletedCall={editCompletedCall}
                orderChangeById={homeState.orderChangeById}
              />
            </div>
            <div
              className="vas-home-page-container"
              data-isactive={homeState.activeHomeTab === "lines" ? true : false}
            >
              {homeState.hospitalsById && homeState.itemsById && (
                <LineProcedures
                  linesSortByOnChange={linesSortByOnChange}
                  lineProcedures={homeState.lineProcedures}
                  hospitalsById={homeState.hospitalsById}
                  usersById={homeState.usersById}
                  itemsById={homeState.itemsById}
                  editCompletedCall={editCompletedCall}
                  reverseSort={reverseSort}
                />
              )}
            </div>
            <div
              className="vas-home-page-container"
              data-isactive={homeState.activeHomeTab === "open" ? true : false}
            >
              {homeState.activeRecord &&
                homeState.hospitals &&
                homeState.callNeeds &&
                homeState.orderChanges &&
                homeState.procedures &&
                homeState.itemsById &&
                homeState.allOptions.length > 0 && (
                  <EditProcedure
                    callNeeds={homeState.callNeeds}
                    hospitals={homeState.hospitals}
                    hospitalsById={homeState.hospitalsById}
                    statusById={homeState.statusById}
                    orderChanges={homeState.orderChanges}
                    activeRecord={homeState.activeRecord}
                    allOptions={homeState.allOptions}
                    procedures={homeState.procedures}
                    usersById={homeState.usersById}
                    itemsById={homeState.itemsById}
                    closeRecordCallback={closeRecordCallback}
                    user={homeState.user}
                    refreshUserSession={refreshUserSession}
                  />
                )}
            </div>
          </div>
          {homeState.modalIsOpen && (
            <Modal
              getConfirmation={getModalConfirmation}
              isConfirmation={homeState.modalConfirmation}
              user={homeState.user}
              closeModal={closeModal}
              modalTitle={homeState.modalTitle}
              modalMessage={homeState.modalMessage}
              toggleModal={toggleHandler}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
