// import Image from "next/image";
import { HomeState } from "../types/HomeState.type";
import { ModalState } from "../types/ModalState.type";

interface HeaderProps {
  updateModalState: (modalObj: Object) => void;
  updateHomeState: (stateObj: Object) => void;
  toggleUserAvailability: () => void;
  showOnlineUsers: () => void;
  hideOnlineUsers: () => void;
  logout: () => void;
  homeState: HomeState;
}

const Header: React.FC<HeaderProps> = (props) => {
  const addCall = () => {
    props.updateModalState({
      content: {
        title: "Add Call",
        message: undefined,
      },
    });
  };

  return (
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
        <button className="vas-button vas-home-add-call" onClick={addCall}>
          Add Call
        </button>
      </div>
      <div className="vas-header-right-container">
        {/* <span className="vas-save-icon">
          <Image src="/save-icon.svg" width={290} height={290} />
        </span> */}
        <span
          title={props.homeState.user?.isAvailable ? "Available" : "Offline"}
          className={
            "vas-home-status-dot " +
            (!props.homeState.user?.isAvailable ? "vas-user-offline" : "")
          }
        ></span>
        <span className="vas-home-main-header-user-container">
          <p
            className="vas-home-main-header-user vas-nowrap"
            onClick={(e) => {
              props.updateHomeState({
                userMenuVisible: !props.homeState.userMenuVisible,
              });
            }}
          >
            {props.homeState.user?.fullname}
            <b>&#9660;</b>
          </p>
          {props.homeState.userMenuVisible && (
            <span>
              <div
                className="vas-home-clickguard"
                onClick={(e) => {
                  props.updateHomeState({
                    userMenuVisible: false,
                  });
                }}
              ></div>
              <ul className="vas-home-user-menu">
                <li onClick={props.toggleUserAvailability}>
                  {props.homeState.user?.isAvailable
                    ? "Go 'Offline'"
                    : "Go 'Online'"}
                </li>
                <li onClick={props.showOnlineUsers}>Show Online Users</li>
              </ul>
            </span>
          )}
        </span>
        <button className="vas-home-main-header-logout" onClick={props.logout}>
          Logout
        </button>
      </div>
      <div
        className={
          "vas-home-online-users " +
          (props.homeState.onlineUsersVisible
            ? "vas-home-show-online-users"
            : "")
        }
      >
        <p
          className="vas-home-hide-online-users"
          onClick={props.hideOnlineUsers}
        >
          &times;
        </p>
        <div className="vas-home-online-users-list">
          <p className="vas-home-online-users-title">Available Users:</p>
          {props.homeState.onlineUsers.map((username, idx) => {
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
      {props.homeState.onlineUsersVisible && (
        <div
          className="vas-home-clickguard"
          onClick={(e) => {
            props.updateHomeState({ onlineUsersVisible: false });
          }}
        ></div>
      )}
    </header>
  );
};

export default Header;
