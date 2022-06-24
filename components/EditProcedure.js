import React, { Component } from "react";
import Modal from "./Modal";
import axios from "axios";
import moment from "moment";
import DatePicker from "react-datepicker";
import { DebounceInput } from "react-debounce-input";

export default class EditProcedure extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentRecord: this.props.activeRecord,
      isPostEdit: this.props.activeRecord.completedAt ? true : false,
      isDressingChange: this.props.activeRecord.dressingChangeDate
        ? true
        : false,
      itemsSelectedArr: null,
      modalIsOpen: false,
      modalTitle: "",
      modalMessage: "",
      modalConfirmation: false,
      confirmationType: null,
      dressingChangeDate: this.props.activeRecord.dressingChangeDate
        ? moment(this.props.activeRecord.dressingChangeDate)
        : moment(),
      willSetDressingChangeDate: this.props.activeRecord.dressingChangeDate
        ? true
        : false,
      dressingChangeDateIsSet: false,
      dob: this.props.activeRecord.dob
        ? moment(this.props.activeRecord.dob)
        : moment(),
      dobIsSet: false,
      closeLine: false,
    };
    this.saveCurrentRecord = this.saveCurrentRecord.bind(this);
    this.hospitalChange = this.hospitalChange.bind(this);
    this.resetSection = this.resetSection.bind(this);
    this.toggleConsultation = this.toggleConsultation.bind(this);
    this.changeCustomInput = this.changeCustomInput.bind(this);
    this.selectButton = this.selectButton.bind(this);
    this.checkSiblings = this.checkSiblings.bind(this);
    this.inputLiveUpdate = this.inputLiveUpdate.bind(this);
    this.completeProcedure = this.completeProcedure.bind(this);
    this.updateProcedure = this.updateProcedure.bind(this);
    this.changeStatus = this.changeStatus.bind(this);
    this.saveNewProcedure = this.saveNewProcedure.bind(this);
    this.createProcedureObject = this.createProcedureObject.bind(this);
    this.procedureSaved = this.procedureSaved.bind(this);
    this.deleteCall = this.deleteCall.bind(this);
    this.returnToQueue = this.returnToQueue.bind(this);
    this.getConfirmation = this.getConfirmation.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.resetModal = this.resetModal.bind(this);
    this.orderSelect = this.orderSelect.bind(this);
    this.toggleSectionDisplay = this.toggleSectionDisplay.bind(this);
    this.handleNeedSelect = this.handleNeedSelect.bind(this);
    this.dressingChangeDateOnChange =
      this.dressingChangeDateOnChange.bind(this);
    this.dobOnChange = this.dobOnChange.bind(this);
    this.toggleShowSection = this.toggleShowSection.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentRecord: nextProps.activeRecord,
      isPostEdit: nextProps.activeRecord.completedAt ? true : false,
      isDressingChange: nextProps.activeRecord.dressingChangeDate
        ? true
        : false,
    });
  }

  componentDidMount() {
    console.log(this.state);
  }

  dressingChangeDateOnChange(date) {
    this.setState({
      dressingChangeDate: date,
    });
  }

  dobOnChange(date) {
    this.setState({
      dob: date,
    });
  }

  changeCustomInput(e, fieldName, type) {
    let fieldValue;
    let currentRecord = this.state.currentRecord;
    switch (type) {
      case "number":
        fieldValue = Number(e.target.value);
        break;
      default:
        fieldValue = e.target.value;
    }
    currentRecord[fieldName] = fieldValue;
    this.setState({ currentRecord });
    this.props.refreshUserSession();
  }

  changeStatus(e) {
    let activeRecord = this.state.currentRecord;
    if (activeRecord.status === 3) {
      //Currently On Hold
      activeRecord.createdAt = new Date().toISOString();
      activeRecord.startTime = new Date().toISOString();
    }
    activeRecord.status = Number(e.target.value);
    this.setState({ activeRecord }, this.saveCurrentRecord);
  }

  checkSiblings(e) {
    let groupContainer = e.target.closest(".vas-edit-procedure-inner-span");
    while (groupContainer.nextSibling) {
      let nextSib = groupContainer.nextSibling.querySelector(
        ".vas-edit-procedure-select-input"
      );
      if (nextSib) {
        //if next id is a
        //55 = PAC:Initiated (Port-A-Cath), 57 = Patient Refused (Insertion Procedure)
        if (nextSib.id === "55" || nextSib.id === "57") {
          nextSib.checked = false;
        } else {
          nextSib.checked = true;
        }
      }
      groupContainer = groupContainer.nextSibling;
    }
  }

  closeModal(callData) {
    if (callData) {
      this.setState(
        {
          modalTitle: "Call Was Added",
          modalMessage: "Your call was added to the queue!",
        },
        () => {
          setTimeout(() => {
            this.resetModal();
          }, 2000);
        }
      );
    } else {
      this.resetModal();
    }
  }

  completeProcedure() {
    if (this.state.currentRecord.completedAt) {
      this.updateProcedure();
    } else {
      this.saveNewProcedure();
    }
    this.props.refreshUserSession();
  }

  createProcedureObject() {
    let procedureObj = {};
    let itemIds = [];
    let selectedTasks = document.querySelectorAll(
      ".vas-edit-procedure-select-input:checked"
    );
    selectedTasks.forEach((el) => {
      let itemId = Number(el.id);
      let procedureId = Number(el.getAttribute("data-procedureid"));
      itemIds.push(itemId);
      if (!procedureObj.hasOwnProperty(procedureId)) {
        procedureObj[procedureId] = [];
      }
      procedureObj[procedureId].push(itemId);
    });

    //UPDATE
    if (this.state.currentRecord.insertionLength > 0) {
      //push insertion length itemId (70) into procedure's object IDs
      if (procedureObj["8"]) {
        procedureObj["8"].push(70);
      }
    }

    let procedureArr = [];
    let procedureIds = [];
    let procedureObjKeys = Object.keys(procedureObj);
    for (let key of procedureObjKeys) {
      procedureIds.push(Number(key));
      procedureArr.push({
        procedureId: Number(key),
        itemIds: procedureObj[key],
      });
    }

    return {
      procedureArr,
      procedureIds,
      itemIds,
    };
  }

  deleteCall() {
    this.setState({
      modalTitle: "Delete Active Record?",
      modalMessage:
        "Are you sure you want to delete the currently active record?",
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "delete-call",
    });
    this.props.refreshUserSession();
  }

  getConfirmation(isConfirmed) {
    if (isConfirmed) {
      // let currentRecord = this.state.currentRecord;
      switch (this.state.confirmationType) {
        case "delete-call":
          axios
            .post("/api/main", {
              _id: this.state.currentRecord._id,
              path: "/delete-call",
            })
            .then((resp) => {
              if (resp.data) {
                this.props.closeRecordCallback("delete");
              }
            })
            .catch((err) => {
              console.log(err);
            });
          break;
        case "reset-page":
          location.reload();
          break;
        case "set-dressing-change":
          this.setState({
            dressingChangeDateIsSet: true,
          });
          break;
        case "close-line-type":
          this.setState({
            closeLine: true,
          });
          break;
        default:
      }
    }
    this.props.refreshUserSession();
  }

  hospitalChange(e) {
    let currentRecord = this.state.currentRecord;
    if (e.target.value !== "") {
      currentRecord.hospital = Number(e.target.value);
      if (currentRecord.hospital !== 6) {
        currentRecord.dob = null;
      }
    } else {
      currentRecord.hospital = null;
    }
    this.setState({ currentRecord }, this.saveCurrentRecord);
  }

  inputLiveUpdate(e, field) {
    let inputEl = e.target;
    inputEl.classList.add("vas-input-success");

    let targetValue = e.target.value;
    let currentRecord = this.state.currentRecord;

    if (e.target.type === "number") {
      currentRecord[field] = Number(targetValue);
    } else {
      currentRecord[field] = targetValue;
    }

    if (targetValue.length < 1) {
      currentRecord[field] = null;
    }
    this.setState({ currentRecord }, () => {
      setTimeout(() => {
        inputEl.classList.remove("vas-input-success");
      }, 1000);
      // inputEl.classList.remove('vas-input-success');
      this.saveCurrentRecord();
    });
  }

  orderSelect(e) {
    let currentRecord = this.state.currentRecord;
    if (e.target.value === "") {
      currentRecord.orderChange = null;
    } else {
      currentRecord.orderChange = Number(e.target.value);
    }
    this.setState({ currentRecord }, this.saveCurrentRecord);
  }

  procedureSaved(isEdit) {
    this.setState(
      {
        activeRecord: null,
        modalTitle: isEdit ? "Procedure Updated" : "Task Complete",
        modalMessage: isEdit
          ? "Procedure was updated. Returning to queue."
          : "Procedure was completed. Returning to queue.",
        modalIsOpen: true,
      },
      () => {
        setTimeout(() => {
          this.props.closeRecordCallback();
        }, 2000);
      }
    );
  }

  procedureVerified(proceduresObj) {
    let errors = "";
    //UPDATE
    let insertionTypesArr = [58, 59, 60, 61, 62, 90];
    let lineTypesArr = [30, 58, 59, 60, 61, 62, 90];
    let isInsertionProcedure = insertionTypesArr.some((r) =>
      proceduresObj.itemIds.includes(r)
    );
    let isLineType = lineTypesArr.some((r) =>
      proceduresObj.itemIds.includes(r)
    );
    let isPortAccess = proceduresObj.itemIds.includes(30);

    if (
      !proceduresObj.itemIds.length &&
      !this.state.currentRecord.wasConsultation
    ) {
      errors +=
        "- You must select at least 1 procedure or confirm consultation\n";
    }

    if (
      this.state.currentRecord.hospital === 6 &&
      this.state.currentRecord.dob === null
    ) {
      errors +=
        "- Please enter patient's date of birth in the 'hospital' section \n";
    }

    if (
      isLineType &&
      !this.state.closeLine &&
      this.state.currentRecord.hospital === "UPDATE"
    ) {
      //Erlanger Main
      if (!this.state.dressingChangeDateIsSet && !this.state.isPostEdit) {
        errors += "- You must select a future dressing change date\n";
      }
    }

    if (isPortAccess) {
      if (
        !this.state.currentRecord.mrn ||
        String(this.state.currentRecord.mrn).length < 5 ||
        String(this.state.currentRecord.mrn).length > 7
      ) {
        errors +=
          "- You must enter and Medical Record Number and it must be between 5 and 7 digits\n";
      }
      if (
        !this.state.currentRecord.patientName ||
        this.state.currentRecord.patientName.length < 7
      ) {
        errors +=
          "- You must enter a patient name and it must be at least 7 characters in length\n";
      }
    }

    if (isInsertionProcedure) {
      if (this.state.currentRecord.insertionLength < 1) {
        errors +=
          "- You must enter an insertion length > 0 if selecting an insertion type\n";
      }
      if (
        !this.state.currentRecord.hospital ||
        this.state.currentRecord.hospital < 1
      ) {
        errors += "- You must select a hospital\n";
      }
      if (
        !this.state.currentRecord.mrn ||
        String(this.state.currentRecord.mrn).length < 5 ||
        String(this.state.currentRecord.mrn).length > 7
      ) {
        errors +=
          "- You must enter and Medical Record Number and it must be between 5 and 7 digits\n";
      }
      if (
        !this.state.currentRecord.patientName ||
        this.state.currentRecord.patientName.length < 7
      ) {
        errors +=
          "- You must enter a patient name and it must be at least 7 characters in length\n";
      }
      if (
        !this.state.currentRecord.provider ||
        !this.state.currentRecord.provider.length
      ) {
        errors += "- You must enter a provider name\n";
      }
    }

    if (
      !this.state.currentRecord.room ||
      !this.state.currentRecord.room.length
    ) {
      errors += "- Room number field cannot be empty\n";
    }

    if (this.state.currentRecord.status === 3) {
      errors +=
        "- Cannot submit a call that is 'on hold'. Change status from dropdown menu at start of form.";
    }

    if (errors.length) {
      this.setState({
        modalIsOpen: true,
        modalTitle: "Cannot Submit Procedure",
        modalMessage: errors,
      });
      return false;
    }
    return true;
  }

  resetForm() {
    this.setState({
      modalTitle: "Reset Form?",
      modalMessage:
        "Are you sure you want to reset the current form? Will cause an app/page reload.",
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "reset-page",
    });
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

  resetSection(e, procedureId) {
    switch (procedureId) {
      case 2: //Lab Draw
      case 8: //Insertion Procedure
        this.setState({
          dressingChangeDateIsSet: false,
          willSetDressingChangeDate: false,
        });
        break;
      default:
    }
    //UPDATE
    let isInsertionProcedure = false;
    let sectionInputs = e.target
      .closest(".vas-edit-procedure-inner-container")
      .querySelectorAll("input");
    sectionInputs.forEach((el) => {
      switch (el.type) {
        case "checkbox":
        case "radio":
          el.checked = false;
          break;
        case "text":
          el.value = "";
          break;
        // case 'number':
        //   el.value = '0';
        //   break;
        default:
      }
      if (!isInsertionProcedure && procedureId === 8) {
        isInsertionProcedure = true;
      }
    });
    if (isInsertionProcedure) {
      document
        .querySelectorAll(
          '.vas-edit-procedure-inner-span[data-procedureid="8"]'
        )
        .forEach((el, idx) => {
          if (idx > 1) {
            el.style.display = "none";
          }
        });
    }

    this.saveCurrentRecord();
    this.props.refreshUserSession();
  }

  returnToQueue() {
    axios
      .post("/api/main", {
        _id: this.state.currentRecord._id,
        path: "/set-call-as-unopen",
      })
      .then((resp) => {
        if (resp.data.error || resp.data._message) {
          console.log(resp.data);
        } else {
          this.props.closeRecordCallback();
        }
      })
      .catch((err) => {
        console.log(err);
      });
    this.props.refreshUserSession();
  }

  saveCurrentRecord() {
    let currentRecord = this.state.currentRecord;
    currentRecord.updatedBy = this.props.currentUser.userId;
    currentRecord.updatedAt = new Date().toISOString();
    this.setState({ currentRecord }, () => {
      axios
        .post("/api/main", {
          currentRecord: this.state.currentRecord,
          path: "/save-call",
        })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            console.log(resp.data);
          } else {
            console.log("active call saved");
          }
        })
        .catch((err) => {
          console.log(err);
        });
      this.props.refreshUserSession();
    });
  }

  saveNewProcedure() {
    let proceduresObj = this.createProcedureObject();
    // console.log(proceduresObj);
    if (this.procedureVerified(proceduresObj)) {
      let completionTime = new Date();
      let callTime = new Date(this.state.currentRecord.createdAt);
      let startTime = new Date(this.state.currentRecord.startTime);
      let callObj = {
        newCallObj: {
          _id: this.state.currentRecord._id,
          proceduresDone: proceduresObj.procedureArr,
          procedureIds: proceduresObj.procedureIds,
          itemIds: proceduresObj.itemIds,
          completedBy: Number(this.props.currentUser.userId),
          completedAt: completionTime.toISOString(),
          procedureTime: completionTime - startTime,
          responseTime: startTime - callTime,
          openBy: null,
        },
      };

      axios
        .post("/api/main", {
          callObj,
          path: "/procedure-completed",
        })
        .then((resp) => {
          if (resp.data.error || resp.data._message) {
            console.log(resp.data);
          } else {
            console.log(resp.data);
            this.procedureSaved(false);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  selectButton(e, groupName, itemId) {
    //UPDATE
    //handle group on select
    switch (groupName) {
      case "What":
        this.checkSiblings(e);
        break;
      case "Insertion Type":
        this.setState({ insertionTypeSelected: true });
        document
          .querySelectorAll(
            '.vas-edit-procedure-inner-span[data-procedure="8"]'
          )
          .forEach((el) => {
            el.style.display = "inline";
          });
        this.checkSiblings(e);
        break;
      default:
    }

    //UPDATE
    switch (itemId) {
      case 30: //Port-A-Cath - Access
      case 58: //START - Insertion Procedures
      case 59: //
      case 60: //
      case 61: //
      case 62: //
      case 90: //END - Insertion Procedures
        this.setState({ willSetDressingChangeDate: true });
        break;
      default:
    }
    this.props.refreshUserSession();
  }

  toggleSectionDisplay(e) {
    let section = e.target.nextSibling;
    let sectionButtons = section.querySelectorAll("input");
    section.classList.toggle("vas-edit-procedure-important-hide");
    sectionButtons.forEach((btn) => {
      btn.checked = false;
    });
  }

  toggleConsultation() {
    let currentRecord = this.state.currentRecord;
    currentRecord.wasConsultation = !currentRecord.wasConsultation;
    this.setState({ currentRecord }, this.saveCurrentRecord);
  }

  updateProcedure() {
    let proceduresObj = this.createProcedureObject();
    if (this.procedureVerified(proceduresObj)) {
      let updatedRecord = this.state.currentRecord;
      updatedRecord.proceduresDone = proceduresObj.procedureArr;
      updatedRecord.procedureIds = proceduresObj.procedureIds;
      updatedRecord.itemIds = proceduresObj.itemIds;
      updatedRecord.openBy = null;
      this.setState({ currentRecord: updatedRecord }, () => {
        this.saveCurrentRecord();
        this.procedureSaved(true);
      });
    }
  }

  handleNeedSelect(e) {
    let currentRecord = this.state.currentRecord;
    if (e.target.value.toLowerCase() === "custom") {
      currentRecord.customJob = "Custom Job";
    } else {
      currentRecord.customJob = null;
    }
    currentRecord.job = e.target.value;
    this.setState({ currentRecord }, this.saveCurrentRecord);
  }

  saveDressingChangeDate(e) {
    this.setState({
      modalTitle: "Set Future Dressing Change Date?",
      modalMessage:
        'This will set the next dressing change date and move this item to the "Lines" tab if it is not already there.',
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "set-dressing-change",
    });
    this.props.refreshUserSession();
  }

  saveDobDate() {
    let currentRecord = this.state.currentRecord;
    currentRecord.dob = this.state.dob;
    this.setState(
      {
        currentRecord,
      },
      this.saveCurrentRecord
    );
  }

  closeLineType() {
    this.setState({
      modalTitle: "Close Line Type?",
      modalMessage:
        "Are you sure you want to close this record? This will prevent having to set additional dressing change dates.",
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "close-line-type",
    });
    this.props.refreshUserSession();
  }

  toggleShowSection(e) {
    e.target
      .closest(".vas-edit-procedure-inner-container")
      .querySelector(".vas-edit-procedure-inner-container-main")
      .classList.toggle("vas-block");
  }

  render() {
    return (
      <div
        className={
          "vas-edit-procedure-page-record-container " +
          (this.state.isPostEdit ? "vas-edit-procedure-is-post-edit " : "") +
          (this.state.isDressingChange
            ? "vas-edit-procedure-is-dressing-change "
            : "")
        }
      >
        {this.state.currentRecord && (
          <span>
            <header
              className={
                "vas-edit-procedure-record-header vas-status-" +
                this.state.currentRecord.status
              }
            >
              {this.state.isPostEdit && (
                <h2 className="vas-edit-procedure-edit-title">
                  Post Procedure Edit
                </h2>
              )}
              {this.state.isDressingChange && (
                <h2 className="vas-edit-procedure-edit-title">
                  Dressing Change
                </h2>
              )}
              <p className="vas-edit-procedure-record-header-text">
                <select
                  className="vas-modal-add-call-input"
                  defaultValue={this.state.currentRecord.job}
                  onChange={this.handleNeedSelect}
                >
                  {this.props.callNeeds &&
                    this.props.callNeeds.map((option) => {
                      return (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      );
                    })}
                </select>
                {this.state.currentRecord.customJob && (
                  <DebounceInput
                    type="text"
                    className="vas-edit-procedure-live-edit-input vas-edit-procedure-custom-job-input vas-block"
                    debounceTimeout={750}
                    value={
                      this.state.currentRecord.customJob
                        ? this.state.currentRecord.customJob
                        : ""
                    }
                    onChange={(e) => {
                      this.inputLiveUpdate(e, "customJob");
                    }}
                  />
                )}
              </p>
              <p className="vas-edit-procedure-record-header-subtext vas-pointer">
                <b className="vas-edit-procedure-room-text">Room:</b>
                <DebounceInput
                  className="vas-edit-procedure-live-edit-input vas-edit-procedure-live-edit-input-room vas-inline-block vas-uppercase"
                  type="text"
                  debounceTimeout={750}
                  value={
                    this.state.currentRecord.room
                      ? this.state.currentRecord.room
                      : ""
                  }
                  onChange={(e) => {
                    this.inputLiveUpdate(e, "room");
                  }}
                />
              </p>
              <div className="vas-edit-procedure-status-container">
                <p className="vas-edit-procedure-status-text">Status:</p>
                <select
                  className="vas-select"
                  value={this.state.currentRecord.status}
                  onChange={this.changeStatus}
                >
                  {this.props.statusById.options.map((option) => {
                    return (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              {this.props.usersById &&
                this.props.usersById[this.state.currentRecord.completedBy] && (
                  <div className="vas-edit-procedure-completed-by-container">
                    <p>
                      <b>Completed By: </b>
                      {this.state.currentRecord.completedBy
                        ? this.props.usersById[
                            this.state.currentRecord.completedBy
                          ].fullname
                        : "N/A"}
                    </p>
                  </div>
                )}
              {this.props.usersById &&
                this.props.usersById[this.state.currentRecord.updatedBy] && (
                  <div className="vas-edit-procedure-completed-by-container">
                    <p>
                      <b>Updated By: </b>
                      {this.state.currentRecord.updatedBy
                        ? this.props.usersById[
                            this.state.currentRecord.updatedBy
                          ].fullname
                        : "N/A"}
                    </p>
                  </div>
                )}
              {!this.state.isPostEdit && (
                <span>
                  <button
                    className="vas-edit-procedure-record-header-btn"
                    onClick={this.resetForm}
                  >
                    Reset Form
                  </button>
                  <button
                    className="vas-edit-procedure-record-header-btn"
                    onClick={this.returnToQueue}
                  >
                    {this.state.dressingChangeDate
                      ? "Return To Lines Tab"
                      : "Return To Queue"}
                  </button>
                </span>
              )}
              {this.state.isPostEdit && (
                <button
                  className="vas-edit-procedure-record-header-btn"
                  onClick={this.props.closeRecordCallback}
                >
                  Cancel Editing
                </button>
              )}
              <button
                className="vas-edit-procedure-record-header-btn vas-warn-btn"
                onClick={this.deleteCall}
              >
                Delete Call
              </button>
            </header>
            <div className="vas-edit-procedure-inner-container vas-edit-procedure-inner-container-main-comment">
              <header className="vas-edit-procedure-inner-container-header">
                <p className="vas-ml-5">Pre-Procedure Notes</p>
              </header>
              <div className="vas-edit-procedure-inner-container-main">
                <div className="vas-edit-procedure-inner-container-row">
                  <DebounceInput
                    element="textarea"
                    className="vas-edit-procedure-add-comments"
                    debounceTimeout={750}
                    value={
                      this.state.currentRecord.preComments
                        ? this.state.currentRecord.preComments
                        : ""
                    }
                    onChange={(e) => {
                      this.inputLiveUpdate(e, "preComments");
                    }}
                  />
                </div>
              </div>
            </div>
            {this.props.procedures.map((procedure, idx) => {
              return (
                <div
                  className="vas-edit-procedure-inner-container"
                  key={procedure._id}
                >
                  <header className="vas-edit-procedure-inner-container-header">
                    <p
                      className="vas-edit-procedure-inner-container-section-name"
                      onClick={this.toggleShowSection}
                    >
                      {procedure.name}
                    </p>
                    <button
                      className="vas-edit-procedure-reset-buttons"
                      onClick={(e) => {
                        this.resetSection(e, procedure.procedureId);
                      }}
                    >
                      Reset
                    </button>
                  </header>
                  <div className="vas-edit-procedure-inner-container-main">
                    {procedure.groups.map((group, idx2) => {
                      let willDisable = false;
                      //disable selecting/deselecting line procedure options by normal users when editing a dressing change
                      if (
                        procedure.procedureId === 8 &&
                        this.state.currentRecord.dressingChangeDate &&
                        this.props.currentUser.role === "user"
                      ) {
                        willDisable = true;
                      }
                      return (
                        <span
                          className="vas-edit-procedure-inner-span"
                          data-procedure={procedure.procedureId}
                          data-idx={idx2}
                          key={idx + "_" + group.groupName}
                        >
                          {group.hideGroup && (
                            <button
                              className="vas-edit-procedure-toggle-section-btn"
                              onClick={this.toggleSectionDisplay}
                            >
                              {group.groupName}
                            </button>
                          )}
                          {!group.hideHeader && <h3>{group.groupName}</h3>}
                          <div
                            className={
                              "vas-edit-procedure-inner-container-row " +
                              (group.hideGroup
                                ? this.state.isPostEdit
                                  ? ""
                                  : "vas-edit-procedure-important-hide "
                                : "")
                            }
                          >
                            {group.groupItems.map((itemId) => {
                              let customInput =
                                group.inputType === "number" ||
                                group.inputType === "text"
                                  ? true
                                  : false;
                              return (
                                <span key={itemId}>
                                  {!customInput && (
                                    <span>
                                      <input
                                        type={group.inputType}
                                        className={
                                          "vas-edit-procedure-select-input vas-" +
                                          group.inputType +
                                          "-select"
                                        }
                                        data-procedureid={procedure.procedureId}
                                        id={itemId}
                                        name={
                                          procedure.procedureId +
                                          "_" +
                                          group.groupName.replace(/\s/g, "")
                                        }
                                        defaultChecked={
                                          this.state.currentRecord.itemIds.indexOf(
                                            itemId
                                          ) > -1
                                            ? true
                                            : false
                                        }
                                        disabled={willDisable}
                                      />
                                      <label
                                        className="vas-btn"
                                        htmlFor={itemId}
                                        onClick={(e) => {
                                          this.selectButton(
                                            e,
                                            group.groupName,
                                            itemId
                                          );
                                        }}
                                      >
                                        {this.props.itemsById[itemId].value}
                                      </label>
                                    </span>
                                  )}
                                  {customInput && (
                                    <span>
                                      <input
                                        type={group.inputType}
                                        className={
                                          "vas-custom-input vas-" +
                                          group.inputType +
                                          "-select"
                                        }
                                        onChange={(e) => {
                                          this.changeCustomInput(
                                            e,
                                            group.fieldName,
                                            group.inputType
                                          );
                                        }}
                                        data-procedureid={procedure.procedureId}
                                        placeholder={
                                          this.props.itemsById[itemId].value
                                        }
                                        value={
                                          this.state.currentRecord[
                                            group.fieldName
                                          ]
                                        }
                                        id={itemId}
                                        readOnly={willDisable}
                                      />
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </span>
                      );
                    })}
                    {procedure.procedureId === 4 && (
                      <span>
                        <div className="vas-edit-procedure-inner-container-row">
                          {/* <label className='vas-mt-15 vas-mb-5 vas-block'>{this.props.allOptions[1].name}:</label>Medical Record Number */}
                          <label className="vas-mt-15 vas-mb-5 vas-block">
                            Medical Record Number:
                          </label>
                          <DebounceInput
                            className="vas-custom-input"
                            debounceTimeout={750}
                            type="number"
                            value={
                              this.state.currentRecord.mrn
                                ? this.state.currentRecord.mrn
                                : ""
                            }
                            onChange={(e) => {
                              this.inputLiveUpdate(e, "mrn");
                            }}
                          />
                        </div>
                        <div className="vas-edit-procedure-inner-container-row">
                          <label className="vas-mt-15 vas-mb-5 vas-block">
                            Patient Name:
                          </label>
                          <DebounceInput
                            className="vas-custom-input"
                            debounceTimeout={750}
                            type="text"
                            value={
                              this.state.currentRecord.patientName
                                ? this.state.currentRecord.patientName
                                : ""
                            }
                            onChange={(e) => {
                              this.inputLiveUpdate(e, "patientName");
                            }}
                          />
                        </div>
                      </span>
                    )}
                    {procedure.procedureId === 8 && (
                      <span>
                        {this.state.currentRecord.insertedBy && (
                          <span>
                            <p className="vas-edit-procedure-insertedBy-label">
                              Placement Inserted By:
                            </p>
                            <DebounceInput
                              type="text"
                              className="vas-input vas-custom-input vas-edit-procedure-insertedBy-input"
                              debounceTimeout={500}
                              value={this.state.currentRecord.insertedBy}
                              onChange={(e) => {
                                this.inputLiveUpdate(e, "insertedBy");
                              }}
                            />
                          </span>
                        )}
                        {(this.state.insertionTypeSelected ||
                          this.state.isPostEdit ||
                          this.state.isDressingChange) && (
                          <div>
                            <div className="vas-edit-procedure-inner-container-row">
                              {/* <h3>{this.props.allOptions[1].name}:</h3>Medical Record Number */}
                              <h3>Medical Record Number:</h3>
                              <DebounceInput
                                className="vas-custom-input"
                                debounceTimeout={750}
                                type="number"
                                value={
                                  this.state.currentRecord.mrn
                                    ? this.state.currentRecord.mrn
                                    : ""
                                }
                                onChange={(e) => {
                                  this.inputLiveUpdate(e, "mrn");
                                }}
                              />
                            </div>
                            <div className="vas-edit-procedure-inner-container-row">
                              <h3>Patient Name:</h3>
                              <DebounceInput
                                className="vas-custom-input"
                                debounceTimeout={750}
                                type="text"
                                value={
                                  this.state.currentRecord.patientName
                                    ? this.state.currentRecord.patientName
                                    : ""
                                }
                                onChange={(e) => {
                                  this.inputLiveUpdate(e, "patientName");
                                }}
                              />
                            </div>
                            <div className="vas-edit-procedure-inner-container-row">
                              {/* <h3>{this.props.allOptions[2].name}:</h3>Provider */}
                              <h3>Provider:</h3>
                              <DebounceInput
                                className="vas-custom-input"
                                debounceTimeout={750}
                                type="text"
                                value={
                                  this.state.currentRecord.provider
                                    ? this.state.currentRecord.provider
                                    : ""
                                }
                                onChange={(e) => {
                                  this.inputLiveUpdate(e, "provider");
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </span>
                    )}
                    {/* Add Dressing Change datepicker for Port-a-Cath and Insertion Procedures*/}
                    {(procedure.procedureId === 4 ||
                      procedure.procedureId === 8) &&
                      this.state.willSetDressingChangeDate &&
                      this.state.currentRecord.hospital === "UPDATE" && (
                        <span>
                          <div className="vas-edit-procedure-inner-container-row">
                            <h3>Future Dressing Change Date</h3>
                            <span className="vas-inline-block">
                              <DatePicker
                                className="vas-home-datepicker"
                                selected={this.state.dressingChangeDate}
                                onChange={this.dressingChangeDateOnChange}
                              />
                            </span>
                            <button
                              className="vas-home-save-date"
                              onClick={(e) => {
                                this.saveDressingChangeDate(e);
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </span>
                      )}
                  </div>
                </div>
              );
            })}
            <div className="vas-edit-procedure-inner-container vas-edit-procedure-order-change">
              <header className="vas-edit-procedure-inner-container-header">
                <p
                  className="vas-edit-procedure-inner-container-section-name"
                  onClick={this.toggleShowSection}
                >
                  MD Order Change
                </p>
              </header>
              <div className="vas-edit-procedure-inner-container-main">
                <select
                  className="vas-select"
                  value={
                    this.state.currentRecord.orderChange
                      ? this.state.currentRecord.orderChange
                      : ""
                  }
                  onChange={this.orderSelect}
                >
                  <option value="">Select An Order Change</option>
                  {this.props.orderChanges &&
                    this.props.orderChanges.options.map((option, idx) => {
                      return (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
            <div className="vas-edit-procedure-inner-container vas-edit-procedure-order-change">
              <header className="vas-edit-procedure-inner-container-header">
                <p
                  className="vas-edit-procedure-inner-container-section-name"
                  onClick={this.toggleShowSection}
                >
                  Consultation
                </p>
                <button
                  className="vas-edit-procedure-reset-buttons"
                  onClick={(e) => {
                    this.resetSection(e);
                  }}
                >
                  Reset
                </button>
              </header>
              <div className="vas-edit-procedure-inner-container-main">
                <input
                  type="checkbox"
                  className="vas-radio-select vas-edit-procedure-consultation-input"
                  id="consultation"
                  defaultChecked={this.state.currentRecord.wasConsultation}
                  onChange={this.toggleConsultation}
                  name="consultation"
                />
                <label className="vas-btn" htmlFor="consultation">
                  Consultation Done
                </label>
              </div>
            </div>
            <div className="vas-edit-procedure-inner-container">
              <header className="vas-edit-procedure-inner-container-header">
                <p
                  className="vas-edit-procedure-inner-container-section-name"
                  onClick={this.toggleShowSection}
                >
                  Hospital
                </p>
              </header>
              <div className="vas-edit-procedure-inner-container-main vas-block">
                <select
                  className="vas-select"
                  value={
                    this.state.currentRecord.hospital
                      ? this.state.currentRecord.hospital
                      : ""
                  }
                  onChange={this.hospitalChange}
                >
                  <option value="">Select A Hospital</option>
                  {this.props.hospitals &&
                    this.props.hospitals.map((subOption, idx2) => {
                      return (
                        <option key={subOption.id} value={subOption.id}>
                          {subOption.name}
                        </option>
                      );
                    })}
                </select>
                {this.state.currentRecord.hospital === 6 && (
                  <div className="vas-edit-procedure-dob-container">
                    <h3>Patient Date of Birth (MM/DD/YYYY):</h3>
                    <span className="vas-inline-block">
                      <DatePicker
                        className="vas-home-datepicker"
                        selected={this.state.dob}
                        onChange={this.dobOnChange}
                      />
                    </span>
                    <button
                      className="vas-home-save-date"
                      onClick={(e) => {
                        this.saveDobDate(e);
                      }}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="vas-edit-procedure-inner-container vas-edit-procedure-inner-container-main-comment">
              <header className="vas-edit-procedure-inner-container-header">
                <p className="vas-ml-5">Additional Comments</p>
              </header>
              <div className="vas-edit-procedure-inner-container-main vas-block">
                <DebounceInput
                  element="textarea"
                  className="vas-edit-procedure-add-comments"
                  debounceTimeout={750}
                  value={
                    this.state.currentRecord.addComments
                      ? this.state.currentRecord.addComments
                      : ""
                  }
                  onChange={(e) => {
                    this.inputLiveUpdate(e, "addComments");
                  }}
                />
              </div>
            </div>
            {this.state.currentRecord.dressingChangeDate &&
              !this.state.closeLine && (
                <div className="vas-edit-procedure-inner-container vas-edit-procedure-important vas-block">
                  <header className="vas-edit-procedure-inner-container-header">
                    <p>Close Line Type</p>
                  </header>
                  <div className="vas-edit-procedure-inner-container-main">
                    <button
                      className="vas-btn-no"
                      onClick={(e) => {
                        this.closeLineType();
                      }}
                    >
                      Close Line Type
                    </button>
                  </div>
                </div>
              )}
            <div className="vas-edit-procedure-inner-container vas-edit-procedure-inner-container-final">
              <header className="vas-edit-procedure-inner-container-header vas-edit-procedure-inner-container-final-header">
                <p className="vas-ml-5">Submit Procedure</p>
              </header>
              <div className="vas-edit-procedure-final-container">
                <div>
                  <p className="vas-edit-procedure-current-user">
                    Current User: <b>{this.props.user.fullname}</b>
                  </p>
                  <p className="vas-edit-procedure-current-user-disclaimer">
                    If this is not you, please ensure you have logged the
                    current user out and logged back in with your own
                    credentials
                  </p>
                  <button
                    className="vas-button vas-edit-procedure-complete-procedure-btn"
                    onClick={this.completeProcedure}
                  >
                    {this.state.isPostEdit ? "Save Record" : "Submit Procedure"}
                  </button>
                </div>
              </div>
            </div>
          </span>
        )}
        {this.state.modalIsOpen && (
          <Modal
            isConfirmation={this.state.modalConfirmation}
            currentUser={this.state.currentUser}
            getConfirmation={this.getConfirmation}
            closeModal={this.closeModal}
            modalTitle={this.state.modalTitle}
            modalMessage={this.state.modalMessage}
            toggleModal={this.toggleHandler}
          />
        )}
      </div>
    );
  }
}
