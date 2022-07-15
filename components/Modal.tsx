import React, { useEffect, useState } from "react";
import { Call } from "../types/Call.type";
import { ModalState } from "../types/ModalState.type";
import { User } from "../types/User.type";
import AddCall from "./AddCall";

interface ModalProps {
  modalState: ModalState;
  getConfirmation: (isConfirmed: boolean) => void;
  user: User;
  closeModal: (modalObj: { call?: Call; modalData?: ModalState }) => void;
}

const Modal: React.FC<ModalProps> = (props: ModalProps) => {
  const [modalState, setModalState] = useState({
    isAddCall: false,
    isEditProcedure: false,
    addCallInputsValidated: false,
  });

  useEffect(() => {
    if (props.modalState.content!.title!.toLowerCase() === "add call") {
      setModalState({ ...modalState, isAddCall: true });
    }
  }, []);

  const closeModal = (call?: Call) => {
    setModalState({ ...modalState, isAddCall: false });
    props.closeModal({ call });
  };

  const addCallValidated = (isValidated: boolean) => {
    setModalState({ ...modalState, addCallInputsValidated: isValidated });
  };

  const getConfirmation = (isConfirmed: boolean) => {
    props.getConfirmation(isConfirmed);
    props.closeModal({});
  };

  return (
    <div className="vas-modal-container">
      <div
        className="vas-modal-clickguard"
        onClick={() => props.closeModal({})}
      ></div>
      <div
        className={
          "vas-modal-content " +
          (modalState.isAddCall
            ? "vas-modal-content-add-call"
            : "vas-modal-content-normal")
        }
      >
        <div className="vas-modal-content-inner">
          <header className="vas-modal-content-header">
            <p className="vas-modal-header-text">
              {props.modalState.content?.title}
            </p>
            <div
              className="vas-modal-content-closeBtn"
              onClick={() => props.closeModal({})}
            >
              &#10006;
            </div>
          </header>
          <div
            className={
              "vas-modal-content-main " +
              (modalState.isAddCall ? "vas-modal-content-main-add-call" : "")
            }
          >
            {/* {this.state.saveConfirmed && (
              <p className="vas-modal-saved-msg">Item added to queue!</p>
            )} */}
            <p className="vas-modal-message">
              {props.modalState.content?.message}
            </p>
            {modalState.isAddCall && (
              <AddCall user={props.user} callAdded={() => closeModal()} />
            )}
          </div>
          {props.modalState.confirmation && (
            <div className="vas-modal-content-buttonContainer-outer">
              <div className="vas-modal-content-buttonContainer">
                <button
                  className="vas-btn-confirm vas-btn-no"
                  onClick={() => {
                    getConfirmation(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="vas-btn-confirm vas-btn-yes"
                  onClick={() => {
                    getConfirmation(true);
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
};

export default Modal;
