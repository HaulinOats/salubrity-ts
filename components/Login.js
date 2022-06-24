import React, { useState } from "react";
import DebounceInput from "react-debounce-input";
import Modal from "./Modal";
import axios from "axios";

const Login = (props) => {
  const [loginState, setLoginState] = useState({
    username: "",
    password: "",
    modalIsOpen: false,
    modalMessage: "",
    modalTitle: "",
    modalConfirmation: false,
    confirmationType: null,
  });

  const loginUser = async () => {
    if (loginValidated()) {
      axios
        .post("/api/main", {
          path: "/login-user",
          username: loginState.username,
          password: loginState.password,
        })
        .then((resp) => {
          console.log(resp.data);
          if (resp.data.error) {
            console.log(resp.data.error);
            alert(resp.data.error);
          } else {
            props.loginCallback(resp.data);
          }
        })
        .catch((err) => {
          alert("Username or password do not match.");
          console.log(err);
        });
    }
  };

  const loginValidated = () => {
    let errors = "";

    if (loginState.username.length < 5) {
      errors += "- Username too short (minimum of 5 characters)\n";
    }
    if (loginState.password.length < 4) {
      errors += "- Password too short (minimum of 4 characters)\n";
    }

    if (errors.length) {
      setLoginState({
        ...loginState,
        modalIsOpen: true,
        modalTitle: "Login Validation Failed",
        modalMessage: errors,
      });
      return false;
    }
    return true;
  };

  const seedSuper = () => {
    axios
      .get("/seed-super")
      .then((resp) => {
        console.log(resp.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const closeModal = () => {
    setLoginState({
      ...loginState,
      modalIsOpen: false,
      modalMessage: "",
      modalTitle: "",
      modalConfirmation: false,
      confirmationType: null,
    });
  };

  return (
    <div className="vas-login-container">
      <div className="vas-login-wrap">
        <div className="vas-login-color-border">
          <div className="vas-login-color-border-block vas-login-color-border-block-1"></div>
          <div className="vas-login-color-border-block vas-login-color-border-block-2"></div>
          <div className="vas-login-color-border-block vas-login-color-border-block-3"></div>
          <div className="vas-login-color-border-block vas-login-color-border-block-4"></div>
          <div className="vas-login-color-border-block vas-login-color-border-block-5"></div>
        </div>
        <h2
          onClick={(e) => {
            window.location.reload();
          }}
        >
          Salubrity
        </h2>
        <h3 className="vas-capitalize">{props.loginType} Login</h3>
        <div className="vas-login-form">
          <DebounceInput
            className="vas-login-username-field"
            placeholder="Username"
            type="text"
            debounceTimeout={100}
            onChange={(e) => {
              setLoginState({ ...loginState, username: e.target.value.trim() });
            }}
          />
          <DebounceInput
            className="vas-login-pw-field"
            placeholder="Password"
            type="password"
            debounceTimeout={100}
            onChange={(e) => {
              setLoginState({ ...loginState, password: e.target.value });
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                loginUser();
              }
            }}
          />
          <button
            className="vas-login-btn"
            onClick={(e) => {
              loginUser();
            }}
          >
            Sign in
          </button>
          <button
            style={{ display: "none" }}
            onClick={(e) => {
              seedSuper();
            }}
          >
            Seed Super
          </button>
          <p>
            Test Username: <b style={{ fontWeight: "bold" }}>Tester</b>
          </p>
          <p>
            Test Password: <b style={{ fontWeight: "bold" }}>1234</b>
          </p>
        </div>
      </div>
      {loginState.modalIsOpen && (
        <Modal
          closeModal={closeModal}
          modalTitle={loginState.modalTitle}
          modalMessage={loginState.modalMessage}
          toggleModal={toggleHandler}
        />
      )}
    </div>
  );
};

export default Login;
