import React, { Component } from "react";
import AddCall from "./AddCall";

export default class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: true,
      modalTitle: this.props.modalTitle,
      modalMessage: this.props.modalMessage,
      currentUser: this.props.currentUser,
      isConfirmation: this.props.isConfirmation,
      isAddCall: false,
      isEditProcedure: false,
      addCallInputsValidated: false,
    };
    this.addCallValidated = this.addCallValidated.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(
      {
        modalTitle: nextProps.modalTitle,
        modalMessage: nextProps.modalMessage,
        isConfirmation: nextProps.isConfirmation,
      },
      this.aggregateData
    );
  }

  componentDidMount() {
    if (this.state.modalTitle === "Add Call") {
      this.setState({ isAddCall: true });
    }
  }

  closeModal(callData) {
    this.setState({ isAddCall: false });
    this.props.closeModal(callData);
  }

  addCallValidated(isValidated) {
    this.setState({ addCallInputsValidated: isValidated });
  }

  getConfirmation(isConfirmed) {
    this.props.getConfirmation(isConfirmed);
    this.props.closeModal();
  }

  render() {
    return (
      <div className="vas-modal-container" data-isOpen={this.state.isOpen}>
        <div
          className="vas-modal-clickguard"
          onClick={(e) => {
            this.props.closeModal();
          }}
        ></div>
        <div
          className={
            "vas-modal-content " +
            (this.state.isAddCall
              ? "vas-modal-content-add-call"
              : "vas-modal-content-normal")
          }
        >
          <div className="vas-modal-content-inner">
            <header className="vas-modal-content-header">
              <p className="vas-modal-header-text">{this.state.modalTitle}</p>
              <div
                className="vas-modal-content-closeBtn"
                onClick={(e) => {
                  this.props.closeModal();
                }}
              >
                &#10006;
              </div>
            </header>
            <div
              className={
                "vas-modal-content-main " +
                (this.state.isAddCall ? "vas-modal-content-main-add-call" : "")
              }
            >
              {this.state.saveConfirmed && (
                <p className="vas-modal-saved-msg">Item added to queue!</p>
              )}
              {this.state.modalMessage && (
                <p className="vas-modal-message">{this.state.modalMessage}</p>
              )}
              {this.state.isAddCall && (
                <AddCall
                  currentUser={this.props.currentUser}
                  callAdded={this.closeModal}
                />
              )}
            </div>
            {this.state.isConfirmation && (
              <div className="vas-modal-content-buttonContainer-outer">
                <div className="vas-modal-content-buttonContainer">
                  <button
                    className="vas-btn-confirm vas-btn-no"
                    onClick={(e) => {
                      this.getConfirmation(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="vas-btn-confirm vas-btn-yes"
                    onClick={(e) => {
                      this.getConfirmation(true);
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
