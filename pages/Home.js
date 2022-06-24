import React, { Component } from "react";
import Modal from "../Components/Modal/Modal";
import Login from "../Components/Login/Login";
import EditProcedure from "../Components/EditProcedure/EditProcedure";
import ReturnedProcedures from "../Components/ReturnedProcedures/ReturnedProcedures";
import LineProcedures from "../Components/LineProcedures/LineProcedures";
import UpdateTimer from "../Components/UpdateTimer/UpdateTimer";
import Queue from "../Components/Queue/Queue";
import helpers from "../helpers";
import axios from "axios";
import ls from "local-storage";
import "./Home.css";

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      errorArr: [],
      activeHomeTab: "queue",
      modalIsOpen: false,
      modalTitle: "",
      modalMessage: "",
      modalConfirmation: false,
      confirmationType: null,
      activeRecord: null,
      queueItems: [],
      completedCalls: [],
      procedures: [],
      allOptions: [],
      allUsers: [],
      usersById: null,
      itemsById: null,
      hospitals: null,
      hospitalsById: null,
      statusById: null,
      orderChanges: null,
      callNeeds: null,
      orderChangeById: [],
      proceduresById: null,
      selectedProcedures: [],
      lastUpdateHide: false,
      lineProcedures: [],
      userMenuVisible: false,
      onlineUsersVisible: false,
      onlineUsers: [],
      linesSortBy: "dressingChangeDate",
    };
    this.toggleHandler = this.toggleHandler.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.addCall = this.addCall.bind(this);
    this.loginCallback = this.loginCallback.bind(this);
    this.refreshUserSession = this.refreshUserSession.bind(this);
    this.logout = this.logout.bind(this);
    this.reverseCompletedSort = this.reverseCompletedSort.bind(this);
    this.stateLoadCalls = this.stateLoadCalls.bind(this);
    this.addToErrorArray = this.addToErrorArray.bind(this);
    this.getOpenCallForUser = this.getOpenCallForUser.bind(this);
    this.visibilityChange = this.visibilityChange.bind(this);
    this.editCompletedCall = this.editCompletedCall.bind(this);
    this.resetState = this.resetState.bind(this);
    this.closeRecordCallback = this.closeRecordCallback.bind(this);
    this.getCompletedCalls = this.getCompletedCalls.bind(this);
    this.getOptionsData = this.getOptionsData.bind(this);
    this.getModalConfirmation = this.getModalConfirmation.bind(this);
    this.reverseSort = this.reverseSort.bind(this);
    this.linesSortByOnChange = this.linesSortByOnChange.bind(this);
    this.toggleUserAvailability = this.toggleUserAvailability.bind(this);
    this.showOnlineUsers = this.showOnlineUsers.bind(this);
    this.hideOnlineUsers = this.hideOnlineUsers.bind(this);
    this.selectJob = this.selectJob.bind(this);
  }

  resetState() {
    this.setState({
      errorArr: [],
      activeHomeTab: "queue",
      modalIsOpen: false,
      modalTitle: "",
      modalMessage: "",
      modalConfirmation: false,
      confirmationType: null,
      activeRecord: null,
      selectedProcedures: [],
      procedureVerified: false,
      insertionTypeSelected: false,
      insertionLength: "",
    });
  }

  componentWillMount() {
    if (ls("currentUser")) {
      this.setState(
        {
          currentUser: ls("currentUser"),
        },
        () => {
          this.refreshUserSession();
          this.stateLoadCalls();
        }
      );
    }

    if (ls("activeHomeTab")) {
      this.setState({ activeHomeTab: ls("activeHomeTab") }, () => {
        this.setTab(this.state.activeHomeTab);
      });
    }

    // Set the name of the hidden property and the change event for visibility
    this.documentProps = {
      hidden: null,
      visibilityChange: null,
    };

    if (typeof document.hidden !== "undefined") {
      // Opera 12.10 and Firefox 18 and later support
      this.documentProps.hidden = "hidden";
      this.documentProps.visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      this.documentProps.hidden = "msHidden";
      this.documentProps.visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      this.documentProps.hidden = "webkitHidden";
      this.documentProps.visibilityChange = "webkitvisibilitychange";
    }

    document.addEventListener("visibilitychange", this.visibilityChange);
  }

  visibilityChange() {
    if (document[this.documentProps.hidden]) {
      this.setState({ lastUpdateHide: true });
    } else {
      if (this.state.activeHomeTab === "queue") {
        this.getActiveCalls();
      }
      if (this.state.activeHomeTab === "complete") {
        this.getCompletedCalls();
      }
      if (this.state.activeHomeTab === "lines") {
        this.getOpenLineProcedures();
      }
    }
  }

  toggleUserAvailability() {
    axios
      .post("/api/main", {
        _id: this.state.currentUser._id,
        path: "/toggle-user-availability",
      })
      .then((resp) => {
        this.setState(
          {
            currentUser: resp.data,
            userMenuVisible: false,
          },
          this.refreshUserSession
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }

  showOnlineUsers() {
    helpers
      .getOnlineUsers()
      .then((resp) => {
        this.setState({
          onlineUsersVisible: true,
          userMenuVisible: false,
          onlineUsers: resp,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  hideOnlineUsers() {
    this.setState({ onlineUsersVisible: false });
  }

  getModalConfirmation(isConfirmed) {
    this.refreshUserSession();
    this.resetModal();
  }

  editCompletedCall(callId, completedBy, dressingChangeDate) {
    let isAdmin =
      this.state.currentUser.role === "admin" ||
      this.state.currentUser.role === "super";
    if (
      isAdmin ||
      this.state.currentUser.userId === completedBy ||
      dressingChangeDate !== null
    ) {
      helpers
        .getCallById(callId, this.state.currentUser.userId)
        .then((resp) => {
          this.setTab("active");
          this.setState({
            activeRecord: resp,
          });
        })
        .catch((err) => {
          this.setState({
            modalTitle: "Record Is Already Open",
            modalMessage: `This record is currently open by ${
              this.state.usersById[err.userId].fullname
            }`,
            modalIsOpen: true,
          });
        });
    } else {
      this.setState({
        modalTitle: "Not Allowed To Edit",
        modalMessage: "You cannot edit someone else's completed record",
        modalIsOpen: true,
      });
    }
  }

  componentDidMount() {
    this.startSessionInterval();
    setTimeout(() => {
      console.log(this.state);
    }, 1000);
  }

  startSessionInterval() {
    console.log("starting intervals...");
    this.sessionInterval = setInterval(() => {
      if (this.state.currentUser) {
        this.checkUserSession();
      }
    }, 180000); //check session every 3 minutes (180000)ms
  }

  stopSessionInterval() {
    clearInterval(this.sessionInterval);
  }

  closeRecordCallback(type) {
    switch (type) {
      case "delete":
        let queueItems = this.state.queueItems;
        for (var i = queueItems.length - 1; i >= 0; i--) {
          if (queueItems[i]._id === this.state.activeRecord._id) {
            queueItems.splice(i, 1);
          }
        }
        this.setState({ queueItems });
        break;
      default:
        axios
          .post("/api/main", {
            _id: this.state.activeRecord._id,
            path: "/set-as-done-editing",
          })
          .then((resp) => {
            console.log(resp.data);
          })
          .catch((err) => {
            console.log(err);
          });
        this.refreshUserSession();
        break;
    }

    this.setTab("queue");
    this.setState({
      activeRecord: null,
    });
  }

  checkUserSession() {
    let currentTime = Math.floor(Date.now() / 1000);
    let timeDiff = currentTime - this.state.currentUser.lastLogin;
    console.log(
      `${Math.floor(timeDiff / 60)} minutes inactive (ends session at 60)`
    );
    if (timeDiff > 3419) {
      this.setState({
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
      this.logout();
    }
  }

  refreshUserSession() {
    let currentUser = this.state.currentUser;
    currentUser.lastLogin = Math.floor(Date.now() / 1000);
    this.setState({ currentUser }, () => {
      ls("currentUser", this.state.currentUser);
    });
  }

  loginCallback(user) {
    if (user.isActive) {
      this.setState(
        {
          currentUser: user,
        },
        () => {
          this.startSessionInterval();
          this.refreshUserSession();
          this.stateLoadCalls();
        }
      );
    } else {
      alert("You are no longer an active user. Please contact admin.");
    }
  }

  logout() {
    this.stopSessionInterval();
    this.setState({ currentUser: null }, this.resetState);
    ls.clear();
  }

  stateLoadCalls() {
    helpers
      .getAllUsers()
      .then((data) => {
        this.setState(
          {
            allUsers: data.usersArr,
            usersById: data.usersById,
          },
          this.getOptionsData
        );
      })
      .catch((err) => {
        this.addToErrorArray(err);
      });

    helpers
      .getProcedureData()
      .then((data) => {
        this.setState({
          proceduresById: data.proceduresById,
          procedures: data.procedures,
        });
      })
      .catch((err) => {
        this.addToErrorArray(err);
      });

    helpers
      .getItemsData()
      .then((data) => {
        this.setState({ itemsById: data });
      })
      .catch((err) => {
        this.addToErrorArray(err);
      });

    this.getActiveCalls();
  }

  getOptionsData() {
    console.log("get options data...");
    helpers
      .getOptionsData()
      .then((data) => {
        this.setState(
          {
            allOptions: data.options,
            hospitals: data.hospitals,
            hospitalsById: data.hospitalsById,
            callNeeds: data.callNeeds,
            orderChanges: data.orderChanges,
            orderChangeById: data.orderChangeById,
            statusById: data.statuses,
          },
          this.getCompletedCalls
        );
      })
      .catch((err) => {
        this.addToErrorArray();
      });
  }

  setTab(tab, event) {
    if (event) {
      let tabElement = event.currentTarget.querySelector(
        ".vas-home-nav-item-refresh-bar"
      );
      tabElement.classList.add("vas-home-refresh-bar-activate");
      setTimeout(() => {
        tabElement.classList.remove("vas-home-refresh-bar-activate");
      }, 1000);
    }
    this.setState({ activeHomeTab: tab }, () => {
      window.scrollTo(0, 0);
      ls("activeHomeTab", this.state.activeHomeTab);
      if (this.state.activeHomeTab === "queue") {
        //forces UpdateTimer component to re-render restarting timer
        this.setState({ lastUpdateHide: true }, () => {
          this.setState({ lastUpdateHide: false });
        });
        this.getActiveCalls();
      }
      if (this.state.activeHomeTab === "complete") {
        //forces UpdateTimer component to re-render restarting timer
        this.setState({ lastUpdateHide: true }, () => {
          this.setState({ lastUpdateHide: false });
          this.getCompletedCalls();
        });
      }
      if (this.state.activeHomeTab === "lines") {
        //forces UpdateTimer component to re-render restarting timer
        this.setState({ lastUpdateHide: true }, () => {
          this.setState({ lastUpdateHide: false });
          this.getOpenLineProcedures();
        });
      }
      if (this.state.activeHomeTab === "active") {
        this.setState({ lastUpdateHide: true });
      }
      this.refreshUserSession();
    });
  }

  addCall() {
    this.setState(
      {
        modalTitle: "Add Call",
        modalIsOpen: true,
      },
      this.refreshUserSession
    );
  }

  getActiveCalls() {
    helpers
      .getActiveCalls()
      .then((data) => {
        this.setState(
          {
            queueItems: data,
            lastUpdateHide: true,
          },
          () => {
            this.setState({ lastUpdateHide: false });
            this.getOpenCallForUser();
          }
        );
      })
      .catch((err) => {
        this.addToErrorArray(err);
      });
  }

  getOpenLineProcedures() {
    helpers
      .getOpenLineProcedures()
      .then((data) => {
        let lineProcedures = data;
        let sortByField = this.state.linesSortBy;
        lineProcedures.sort((a, b) => {
          if (a[sortByField] > b[sortByField]) return 1;
          if (a[sortByField] < b[sortByField]) return -1;
          return 0;
        });
        this.setState(
          {
            lineProcedures,
            lastUpdateHide: true,
          },
          () => {
            this.setState({ lastUpdateHide: false });
          }
        );
      })
      .catch((err) => {
        this.addToErrorArray(err);
      });
  }

  getCompletedCalls() {
    helpers
      .getCompletedCalls()
      .then((data) => {
        let calls = data;
        for (let i = 0; i < calls.length; i++) {
          //add nurse name to call for sorting
          if (calls[i].completedBy !== null) {
            calls[i].completedByName =
              this.state.usersById[calls[i].completedBy].fullname;
          } else {
            calls[i].completedByName = null;
          }
          //add hospital name to call for sorting
          if (calls[i].hospital !== null) {
            calls[i].hospitalName =
              this.state.hospitalsById[calls[i].hospital].name;
          } else {
            calls[i].hospitalName = null;
          }
        }
        this.setState(
          {
            completedCalls: calls,
            lastUpdateHide: true,
          },
          () => {
            this.setState({ lastUpdateHide: false });
          }
        );
      })
      .catch((err) => {
        this.addToErrorArray(err);
      });
  }

  getOpenCallForUser() {
    helpers
      .getOpenCallForUser(this.state.currentUser.userId)
      .then((data) => {
        this.setState({
          activeRecord: data,
        });
      })
      .catch((err) => {
        // console.log(err);
      });
  }

  addToErrorArray(err) {
    let errArr = this.state.errorArr;
    errArr.push(err);
    this.setState({ errorArr: errArr });
  }

  reverseCompletedSort() {
    let items = this.state.completedCalls;
    this.setState({ completedCalls: items.reverse() });
    this.refreshUserSession();
  }

  toggleHandler() {
    this.setState(
      {
        modalIsOpen: !this.state.modalIsOpen,
      },
      this.refreshUserSession
    );
  }

  closeModal(callDataReturned) {
    let callData = callDataReturned;
    if (callData) {
      let queueItems = this.state.queueItems;
      queueItems.push(callData);
      this.setState(
        {
          queueItems,
          modalTitle: "Call Was Added",
          modalMessage: "Your call was added to the queue!",
          activeRecord: callData.openBy ? callData : this.state.activeRecord,
        },
        () => {
          setTimeout(() => {
            if (callData.openBy) {
              this.setTab("active");
            }
            this.resetModal();
          }, 2000);
        }
      );
    } else {
      this.resetModal();
    }
  }

  resetModal() {
    this.setState({
      modalIsOpen: false,
      modalMessage: "",
      modalTitle: "",
      modalConfirmation: false,
      confirmationType: null,
    });
  }

  selectJob(job) {
    if (!this.state.activeRecord) {
      if (job.openBy) {
        this.setState({
          modalIsOpen: true,
          modalTitle: "Record Already Open",
          modalMessage: "This record is currently opened by someone else",
        });
      } else {
        axios
          .post("/api/main", {
            _id: job._id,
            userId: this.state.currentUser.userId,
            path: "/set-call-as-open",
          })
          .then((resp) => {
            if (resp.data.error || resp.data._message) {
              console.log(resp.data);
            } else {
              this.setState(
                {
                  activeRecord: resp.data,
                },
                () => {
                  this.setTab("active");
                }
              );
            }
          })
          .catch((err) => {
            console.log(err);
            this.addToErrorArray(err);
          });
      }
    } else {
      if (job._id !== this.state.activeRecord._id) {
        this.setState({
          modalIsOpen: true,
          modalTitle: "You Have An Open Record",
          modalMessage:
            'You already have a record open. Complete it or "Return To Queue" to select a different one.',
        });
      }
      this.setTab("active");
    }
    this.refreshUserSession();
  }

  procedureOptionCustomChange(e, field) {
    this.setState({ [field]: e.target.value });
    this.refreshUserSession();
  }

  reverseSort(arrayToReverse) {
    switch (arrayToReverse) {
      case "lines":
        this.setState({ lineProcedures: this.state.lineProcedures.reverse() });
        break;
      default:
    }
  }

  linesSortByOnChange(e) {
    let sortField = e.target.value;
    let lineProcedures = this.state.lineProcedures;
    lineProcedures.sort((a, b) => {
      if (a[sortField] > b[sortField]) return 1;
      if (a[sortField] < b[sortField]) return -1;
      return 0;
    });
    this.setState(
      {
        linesSortBy: e.target.value,
        lineProcedures,
      },
      () => {
        console.log(this.state.linesSortBy);
      }
    );
  }

  render() {
    return (
      <div>
        {!this.state.currentUser && (
          <Login loginType={"user"} loginCallback={this.loginCallback} />
        )}
        {this.state.currentUser && this.state.usersById && (
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
                  onClick={this.addCall}
                >
                  Add Call
                </button>
              </div>
              <div className="vas-header-right-container">
                <span
                  title={
                    this.state.currentUser.isAvailable ? "Available" : "Offline"
                  }
                  className={
                    "vas-home-status-dot " +
                    (!this.state.currentUser.isAvailable
                      ? "vas-user-offline"
                      : "")
                  }
                ></span>
                <span className="vas-home-main-header-user-container">
                  <p
                    className="vas-home-main-header-user vas-nowrap"
                    onClick={(e) => {
                      this.setState({
                        userMenuVisible: !this.state.userMenuVisible,
                      });
                    }}
                  >
                    {this.state.currentUser.fullname}
                    <b>&#9660;</b>
                  </p>
                  {this.state.userMenuVisible && (
                    <span>
                      <div
                        className="vas-home-clickguard"
                        onClick={(e) => {
                          this.setState({ userMenuVisible: false });
                        }}
                      ></div>
                      <ul className="vas-home-user-menu">
                        <li onClick={this.toggleUserAvailability}>
                          {this.state.currentUser.isAvailable
                            ? "Go 'Offline'"
                            : "Go 'Online'"}
                        </li>
                        <li onClick={this.showOnlineUsers}>
                          Show Online Users
                        </li>
                      </ul>
                    </span>
                  )}
                </span>
                <button
                  className="vas-home-main-header-logout"
                  onClick={this.logout}
                >
                  Logout
                </button>
              </div>
              <div
                className={
                  "vas-home-online-users " +
                  (this.state.onlineUsersVisible
                    ? "vas-home-show-online-users"
                    : "")
                }
              >
                <p
                  className="vas-home-hide-online-users"
                  onClick={this.hideOnlineUsers}
                >
                  &times;
                </p>
                <div className="vas-home-online-users-list">
                  <p className="vas-home-online-users-title">
                    Available Users:
                  </p>
                  {this.state.onlineUsers.map((username, idx) => {
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
              {this.state.onlineUsersVisible && (
                <div
                  className="vas-home-clickguard"
                  onClick={(e) => {
                    this.setState({ onlineUsersVisible: false });
                  }}
                ></div>
              )}
            </header>
            <ul className="vas-home-nav-tabs">
              <li
                className="vas-home-nav-item"
                data-isactive={
                  this.state.activeHomeTab === "queue" ? true : false
                }
                onClick={(e) => {
                  this.setTab("queue", e);
                }}
              >
                <p className="vas-home-nav-item-text">Queue</p>
                <div className="vas-home-nav-item-refresh-bar"></div>
              </li>
              <li
                className="vas-home-nav-item"
                data-isactive={
                  this.state.activeHomeTab === "complete" ? true : false
                }
                onClick={(e) => {
                  this.setTab("complete", e);
                }}
              >
                <p className="vas-home-nav-item-text">Completed</p>
                <div className="vas-home-nav-item-refresh-bar"></div>
              </li>
              {/* <li className='vas-home-nav-item' data-isactive={this.state.activeHomeTab === 'lines' ? true : false} onClick={e=>{this.setTab('lines', e)}}>
                <p className='vas-home-nav-item-text'>Lines</p>
                <div className='vas-home-nav-item-refresh-bar'></div>
              </li> */}
              {this.state.activeRecord && (
                <li
                  className={
                    "vas-home-nav-item vas-status-" +
                    this.state.activeRecord.status
                  }
                  data-isactive={
                    this.state.activeHomeTab === "active" ? true : false
                  }
                  onClick={(e) => {
                    this.setTab("active", e);
                  }}
                >
                  <p className="vas-home-nav-item-text">Open</p>
                  <div className="vas-home-nav-item-refresh-bar"></div>
                </li>
              )}
              {!this.state.lastUpdateHide && <UpdateTimer />}
            </ul>
            <div className="vas-home-tabContent">
              <div
                className="vas-home-page-container"
                data-isactive={
                  this.state.activeHomeTab === "queue" ? true : false
                }
              >
                <Queue
                  queueItems={this.state.queueItems}
                  hospitalsById={this.state.hospitalsById}
                  usersById={this.state.usersById}
                  selectJob={this.selectJob}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={
                  this.state.activeHomeTab === "complete" ? true : false
                }
              >
                <ReturnedProcedures
                  queriedProcedures={this.state.completedCalls}
                  hospitalsById={this.state.hospitalsById}
                  usersById={this.state.usersById}
                  itemsById={this.state.itemsById}
                  proceduresById={this.state.proceduresById}
                  editCompletedCall={this.editCompletedCall}
                  orderChangeById={this.state.orderChangeById}
                />
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={
                  this.state.activeHomeTab === "lines" ? true : false
                }
              >
                {this.state.hospitalsById && this.state.itemsById && (
                  <LineProcedures
                    linesSortByOnChange={this.linesSortByOnChange}
                    lineProcedures={this.state.lineProcedures}
                    hospitalsById={this.state.hospitalsById}
                    usersById={this.state.usersById}
                    itemsById={this.state.itemsById}
                    editCompletedCall={this.editCompletedCall}
                    reverseSort={this.reverseSort}
                  />
                )}
              </div>
              <div
                className="vas-home-page-container"
                data-isactive={
                  this.state.activeHomeTab === "active" ? true : false
                }
              >
                {this.state.activeRecord &&
                  this.state.hospitals &&
                  this.state.callNeeds &&
                  this.state.orderChanges &&
                  this.state.procedures &&
                  this.state.itemsById &&
                  this.state.allOptions.length > 0 && (
                    <EditProcedure
                      callNeeds={this.state.callNeeds}
                      hospitals={this.state.hospitals}
                      hospitalsById={this.state.hospitalsById}
                      statusById={this.state.statusById}
                      orderChanges={this.state.orderChanges}
                      activeRecord={this.state.activeRecord}
                      allOptions={this.state.allOptions}
                      procedures={this.state.procedures}
                      usersById={this.state.usersById}
                      itemsById={this.state.itemsById}
                      refreshUserSession={this.refreshUserSession}
                      closeRecordCallback={this.closeRecordCallback}
                      currentUser={this.state.currentUser}
                    />
                  )}
              </div>
            </div>
            {this.state.modalIsOpen && (
              <Modal
                getConfirmation={this.getModalConfirmation}
                isConfirmation={this.state.modalConfirmation}
                currentUser={this.state.currentUser}
                closeModal={this.closeModal}
                modalTitle={this.state.modalTitle}
                modalMessage={this.state.modalMessage}
                toggleModal={this.toggleHandler}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}
