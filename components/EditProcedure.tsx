import { createRef, Ref, RefObject, useMemo, useState } from "react";
import Modal from "./Modal";
import axios from "axios";
import moment, { Moment } from "moment";
import DatePicker from "react-datepicker";
import { DebounceInput } from "react-debounce-input";
import Call from "../types/Call.type";
import Option from "../types/Option.type";
import Procedure from "../types/Procedure.type";
import { User } from "../types/User.type";
import Item from "../types/Item.type";
import CallNeed from "../types/CallNeed.type";
import OrderChange from "../types/OrderChange.type";

interface EditProcedureProps {
  activeCall: Call;
  callNeeds: undefined | CallNeed[];
  hospitals: { id: string | number; name: string }[];
  statusById: { options: { id: string | number; name: string }[] };
  orderChanges: OrderChange;
  procedures: Procedure[];
  usersById: { [key: number]: User };
  itemsById: { [key: number]: Item };
  closeRecordCallback: (shouldDelete?: boolean) => void;
  user: User;
  refreshUserSession: () => void;
  saveActiveCall: (record: Call | undefined) => void;
}

interface EditProcedureState {
  isPostEdit: boolean;
  isDressingChange: boolean;
  modalIsOpen: boolean;
  modalTitle: undefined | string;
  modalMessage: undefined | string;
  modalConfirmation: boolean;
  confirmationType: undefined | string;
  dressingChangeDate: Moment;
  willSetDressingChangeDate: boolean;
  dressingChangeDateIsSet: boolean;
  dob: Moment;
  dobIsSet: boolean;
  closeLine: boolean;
  insertionTypeSelected: boolean;
}

const EditProcedure: React.FC<EditProcedureProps> = (
  props: EditProcedureProps
) => {
  const procedureMainRefs = useMemo(
    () => props.procedures.map(() => createRef<HTMLDivElement>()),
    []
  );
  const consultationMainRef = createRef<HTMLDivElement>();
  const hospitalMainRef = createRef<HTMLDivElement>();
  const orderMainRef = createRef<HTMLDivElement>();

  const [editProcedureState, setEditProcedureState] =
    useState<EditProcedureState>({
      isPostEdit: props.activeCall.completedAt ? true : false,
      isDressingChange: props.activeCall.dressingChangeDate ? true : false,
      modalIsOpen: false,
      modalTitle: "",
      modalMessage: "",
      modalConfirmation: false,
      confirmationType: undefined,
      dressingChangeDate: props.activeCall.dressingChangeDate
        ? moment(props.activeCall.dressingChangeDate)
        : moment(),
      willSetDressingChangeDate: props.activeCall.dressingChangeDate
        ? true
        : false,
      dressingChangeDateIsSet: false,
      dob: props.activeCall.dob ? moment(props.activeCall.dob) : moment(),
      dobIsSet: false,
      closeLine: false,
      insertionTypeSelected: false,
    });

  // componentWillReceiveProps(nextProps) {
  //   setEditProcedureState({
  // ...editProcedureState,
  //     isPostEdit: nextProps.activeCall.completedAt ? true : false,
  //     isDressingChange: nextProps.activeCall.dressingChangeDate
  //       ? true
  //       : false,
  //   });
  // }

  // componentDidMount() {
  //   console.log("EditProcedure mounted");
  //   console.log({ props: props, state: editProcedureState });
  // }

  const dressingChangeDateOnChange = (date: Date) => {
    setEditProcedureState({
      ...editProcedureState,
      dressingChangeDate: moment(date),
    });
  };

  const dobOnChange = (date: Date) => {
    setEditProcedureState({
      ...editProcedureState,
      dob: moment(date),
    });
  };

  const changeCustomInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    type: string
  ) => {
    let fieldValue;
    let activeCall = { ...props.activeCall };
    switch (type) {
      case "number":
        fieldValue = Number(e.target.value);
        break;
      default:
        fieldValue = e.target.value;
    }
    activeCall[fieldName] = fieldValue;
    props.saveActiveCall(activeCall);
  };

  const changeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let activeCall = props.activeCall;
    if (activeCall.status === 3) {
      //Currently On Hold
      activeCall.createdAt = new Date();
      activeCall.startTime = new Date();
    }
    activeCall.status = Number(e.target.value);
    props.saveActiveCall(activeCall);
  };

  const checkSiblings = (e: React.MouseEvent<HTMLLabelElement>) => {
    console.log("checkSiblings");
    console.log(e);
    return;
    // while (groupContainer.nextSibling) {
    //   let nextSib = groupContainer.nextSibling.querySelector(
    //     ".vas-edit-procedure-select-input"
    //   );
    //   if (nextSib) {
    //     //if next id is a
    //     //55 = PAC:Initiated (Port-A-Cath), 57 = Patient Refused (Insertion Procedure)
    //     if (nextSib.id === "55" || nextSib.id === "57") {
    //       nextSib.checked = false;
    //     } else {
    //       nextSib.checked = true;
    //     }
    //   }
    //   groupContainer = groupContainer.nextSibling;
    // }
  };

  const closeModal = (callData?: Call) => {
    if (callData) {
      setEditProcedureState({
        ...editProcedureState,
        modalTitle: "Call Was Added",
        modalMessage: "Your call was added to the queue!",
      });
      //   setTimeout(() => {
      //     resetModal();
      //   }, 2000);
    } else {
      resetModal();
    }
  };

  const completeProcedure = () => {
    if (props.activeCall.completedAt) {
      updateProcedure();
    } else {
      saveNewProcedure();
    }
    props.refreshUserSession();
  };

  const createProcedureObject = () => {
    let procedureObj: any = {};
    let itemIds: any[] = [];
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
    if (props.activeCall.insertionLength > 0) {
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
  };

  const deleteCall = () => {
    setEditProcedureState({
      ...editProcedureState,
      modalTitle: "Delete Active Record?",
      modalMessage:
        "Are you sure you want to delete the currently active record?",
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "delete-call",
    });
    props.refreshUserSession();
  };

  const getConfirmation = (isConfirmed: boolean) => {
    if (isConfirmed) {
      // let activeCall = props.activeCall;
      switch (editProcedureState.confirmationType) {
        case "delete-call":
          axios
            .post("/api/main", {
              _id: props.activeCall._id,
              path: "/delete-call",
            })
            .then((resp) => {
              if (resp.data) {
                props.closeRecordCallback(true);
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
          setEditProcedureState({
            ...editProcedureState,
            dressingChangeDateIsSet: true,
          });
          break;
        case "close-line-type":
          setEditProcedureState({
            ...editProcedureState,
            closeLine: true,
          });
          break;
        default:
      }
    }
    props.refreshUserSession();
  };

  const hospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let activeCall = { ...props.activeCall };
    if (e.target.value !== "") {
      activeCall.hospital = Number(e.target.value);
      if (activeCall.hospital !== 6) {
        activeCall.dob = undefined;
      }
    } else {
      activeCall.hospital = undefined;
    }
    props.saveActiveCall(activeCall);
  };

  const inputLiveUpdate = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    let targetValue = e.target.value;
    let activeCall = props.activeCall;

    activeCall[field] = targetValue;

    if (e.target.type === "number") {
      if (Number(targetValue) < 1) {
        activeCall[field] = undefined;
      } else {
        activeCall[field] = Number(targetValue);
      }
    }
    props.saveActiveCall(activeCall);
  };

  const orderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let activeCall = props.activeCall;
    if (e.target.value === "") {
      activeCall.orderChange = undefined;
    } else {
      activeCall.orderChange = Number(e.target.value);
    }
    props.saveActiveCall(activeCall);
  };

  const procedureSaved = (isEdit: boolean) => {
    setEditProcedureState({
      ...editProcedureState,
      modalTitle: isEdit ? "Procedure Updated" : "Task Complete",
      modalMessage: isEdit
        ? "Procedure was updated. Returning to queue."
        : "Procedure was completed. Returning to queue.",
      modalIsOpen: true,
    });
    props.closeRecordCallback();
  };

  const procedureVerified = (proceduresObj: any) => {
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

    if (!proceduresObj.itemIds.length && !props.activeCall.wasConsultation) {
      errors +=
        "- You must select at least 1 procedure or confirm consultation\n";
    }

    if (props.activeCall.hospital === 6 && props.activeCall.dob === undefined) {
      errors +=
        "- Please enter patient's date of birth in the 'hospital' section \n";
    }

    if (isLineType && !editProcedureState.closeLine) {
      //Erlanger Main
      if (
        !editProcedureState.dressingChangeDateIsSet &&
        !editProcedureState.isPostEdit
      ) {
        errors += "- You must select a future dressing change date\n";
      }
    }

    if (isPortAccess) {
      if (
        !props.activeCall.mrn ||
        String(props.activeCall.mrn).length < 5 ||
        String(props.activeCall.mrn).length > 7
      ) {
        errors +=
          "- You must enter and Medical Record Number and it must be between 5 and 7 digits\n";
      }
      if (
        !props.activeCall.patientName ||
        props.activeCall.patientName.length < 7
      ) {
        errors +=
          "- You must enter a patient name and it must be at least 7 characters in length\n";
      }
    }

    if (isInsertionProcedure) {
      if (props.activeCall.insertionLength < 1) {
        errors +=
          "- You must enter an insertion length > 0 if selecting an insertion type\n";
      }
      if (!props.activeCall.hospital || props.activeCall.hospital < 1) {
        errors += "- You must select a hospital\n";
      }
      if (
        !props.activeCall.mrn ||
        String(props.activeCall.mrn).length < 5 ||
        String(props.activeCall.mrn).length > 7
      ) {
        errors +=
          "- You must enter and Medical Record Number and it must be between 5 and 7 digits\n";
      }
      if (
        !props.activeCall.patientName ||
        props.activeCall.patientName.length < 7
      ) {
        errors +=
          "- You must enter a patient name and it must be at least 7 characters in length\n";
      }
      if (!props.activeCall.provider || !props.activeCall.provider.length) {
        errors += "- You must enter a provider name\n";
      }
    }

    if (!props.activeCall.room || !props.activeCall.room.length) {
      errors += "- Room number field cannot be empty\n";
    }

    if (props.activeCall.status === 3) {
      errors +=
        "- Cannot submit a call that is 'on hold'. Change status from dropdown menu at start of form.";
    }

    if (errors.length) {
      setEditProcedureState({
        ...editProcedureState,
        modalIsOpen: true,
        modalTitle: "Cannot Submit Procedure",
        modalMessage: errors,
      });
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setEditProcedureState({
      ...editProcedureState,
      modalTitle: "Reset Form?",
      modalMessage:
        "Are you sure you want to reset the current form? Will cause an app/page reload.",
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "reset-page",
    });
  };

  const resetModal = () => {
    setEditProcedureState({
      ...editProcedureState,
      modalIsOpen: false,
      modalMessage: "",
      modalTitle: "",
      modalConfirmation: false,
      confirmationType: undefined,
    });
  };

  const resetSection = (
    ref: RefObject<HTMLDivElement>,
    procedureId?: number
  ) => {
    switch (procedureId) {
      case 2: //Lab Draw
      case 8: //Insertion Procedure
        setEditProcedureState({
          ...editProcedureState,
          dressingChangeDateIsSet: false,
          willSetDressingChangeDate: false,
        });
        break;
      default:
    }
    //UPDATE
    let isInsertionProcedure = false;
    let sectionInputs = ref.current?.querySelectorAll("input");
    sectionInputs?.forEach((el) => {
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
      console.log("fix later");
      //   document
      //     .querySelectorAll(
      //       '.vas-edit-procedure-inner-span[data-procedureid="8"]'
      //     )
      //     .forEach((el, idx) => {
      //       if (idx > 1) {
      //         el.style.display = "none";
      //       }
      //     });
    }
  };

  const returnToQueue = () => {
    axios
      .post("/api/main", {
        _id: props.activeCall._id,
        path: "/set-call-as-unopen",
      })
      .then((resp) => {
        if (resp.data.error || resp.data._message) {
          console.log(resp.data);
        } else {
          props.closeRecordCallback();
        }
      })
      .catch((err) => {
        console.log(err);
      });
    props.refreshUserSession();
  };

  const saveNewProcedure = () => {
    let proceduresObj = createProcedureObject();
    // console.log(proceduresObj);
    if (procedureVerified(proceduresObj)) {
      let completionTime = new Date();
      let callTime = props.activeCall.createdAt!.getTime() / 1000;
      let startTime = props.activeCall.startTime.getTime() / 1000;
      let callObj = {
        _id: props.activeCall._id,
        proceduresDone: proceduresObj.procedureArr,
        procedureIds: proceduresObj.procedureIds,
        itemIds: proceduresObj.itemIds,
        completedBy: Number(props.user.userId),
        completedAt: completionTime.toISOString(),
        procedureTime: completionTime.getTime() / 1000 - startTime,
        responseTime: startTime - callTime,
        openBy: undefined,
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
            procedureSaved(false);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const selectButton = (
    e: React.MouseEvent<HTMLLabelElement>,
    groupName: string,
    itemId: string | number
  ) => {
    //UPDATE
    //handle group on select
    switch (groupName) {
      case "What":
        checkSiblings(e);
        break;
      case "Insertion Type":
        setEditProcedureState({
          ...editProcedureState,
          insertionTypeSelected: true,
        });

        // document
        //   .querySelectorAll(
        //     '.vas-edit-procedure-inner-span[data-procedure="8"]'
        //   )
        //   .forEach((el) => {
        //     el.style.display = "inline";
        //   });
        checkSiblings(e);
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
        setEditProcedureState({
          ...editProcedureState,
          willSetDressingChangeDate: true,
        });
        break;
      default:
    }
    props.refreshUserSession();
  };

  const toggleSectionDisplay = (e: React.MouseEvent) => {
    // let section = e.target.nextSibling;
    // let sectionButtons = section.querySelectorAll("input");
    // section.classList.toggle("vas-edit-procedure-important-hide");
    // sectionButtons.forEach((btn) => {
    //   btn.checked = false;
    // });
  };

  const toggleConsultation = () => {
    let activeCall = props.activeCall;
    activeCall.wasConsultation = !activeCall.wasConsultation;
    props.saveActiveCall(activeCall);
  };

  const updateProcedure = () => {
    let proceduresObj = createProcedureObject();
    if (procedureVerified(proceduresObj)) {
      let updatedRecord = { ...props.activeCall };
      updatedRecord.proceduresDone = proceduresObj.procedureArr;
      updatedRecord.procedureIds = proceduresObj.procedureIds;
      updatedRecord.itemIds = proceduresObj.itemIds;
      updatedRecord.openBy = undefined;
      props.saveActiveCall(updatedRecord);
    }
  };

  const handleNeedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let activeCall = props.activeCall;
    if (e.target.value.toLowerCase() === "custom") {
      activeCall.customJob = "Custom Job";
    } else {
      activeCall.customJob = undefined;
    }
    activeCall.job = e.target.value;
    props.saveActiveCall(activeCall);
  };

  const saveDressingChangeDate = (e: React.MouseEvent) => {
    setEditProcedureState({
      ...editProcedureState,
      modalTitle: "Set Future Dressing Change Date?",
      modalMessage:
        'This will set the next dressing change date and move this item to the "Lines" tab if it is not already there.',
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "set-dressing-change",
    });
    props.refreshUserSession();
  };

  const saveDobDate = () => {
    let activeCall = { ...props.activeCall };
    activeCall.dob = editProcedureState.dob.toDate();
    props.saveActiveCall(activeCall);
  };

  const closeLineType = () => {
    setEditProcedureState({
      ...editProcedureState,
      modalTitle: "Close Line Type?",
      modalMessage:
        "Are you sure you want to close this record? This will prevent having to set additional dressing change dates.",
      modalIsOpen: true,
      modalConfirmation: true,
      confirmationType: "close-line-type",
    });
    props.refreshUserSession();
  };

  const toggleShowSection = (sectionRef: RefObject<HTMLDivElement>) => {
    console.log(sectionRef.current);
    sectionRef.current?.classList.toggle("vas-edit-procedure-expand");
  };

  return (
    <div
      className={
        "vas-edit-procedure-page-record-container " +
        (editProcedureState.isPostEdit
          ? "vas-edit-procedure-is-post-edit "
          : "") +
        (editProcedureState.isDressingChange
          ? "vas-edit-procedure-is-dressing-change "
          : "")
      }
    >
      {props.activeCall && (
        <span>
          <header
            className={
              "vas-edit-procedure-record-header vas-status-" +
              props.activeCall.status
            }
          >
            {editProcedureState.isPostEdit && (
              <h2 className="vas-edit-procedure-edit-title">
                Post Procedure Edit
              </h2>
            )}
            {editProcedureState.isDressingChange && (
              <h2 className="vas-edit-procedure-edit-title">Dressing Change</h2>
            )}
            <p className="vas-edit-procedure-record-header-text">
              <select
                className="vas-modal-add-call-input"
                defaultValue={props.activeCall.job}
                onChange={handleNeedSelect}
              >
                {props.callNeeds &&
                  props.callNeeds.map((option) => {
                    return (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    );
                  })}
              </select>
              {props.activeCall.customJob && (
                <DebounceInput
                  type="text"
                  className="vas-edit-procedure-live-edit-input vas-edit-procedure-custom-job-input vas-block"
                  debounceTimeout={750}
                  value={
                    props.activeCall.customJob ? props.activeCall.customJob : ""
                  }
                  onChange={(e) => {
                    inputLiveUpdate(e, "customJob");
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
                value={props.activeCall.room ? props.activeCall.room : ""}
                onChange={(e) => {
                  inputLiveUpdate(e, "room");
                }}
              />
            </p>
            <div className="vas-edit-procedure-status-container">
              <p className="vas-edit-procedure-status-text">Status:</p>
              <select
                className="vas-select"
                value={props.activeCall.status}
                onChange={changeStatus}
              >
                {props.statusById.options.map((option) => {
                  return (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  );
                })}
              </select>
            </div>
            {props.usersById
              ? [props.activeCall.completedBy] && (
                  <div className="vas-edit-procedure-completed-by-container">
                    <p>
                      <b>Completed By: </b>
                      {props.activeCall.completedBy
                        ? props.usersById[props.activeCall.completedBy].fullname
                        : "N/A"}
                    </p>
                  </div>
                )
              : null}
            {props.usersById
              ? [props.activeCall.updatedBy] && (
                  <div className="vas-edit-procedure-completed-by-container">
                    <p>
                      <b>Updated By: </b>
                      {props.activeCall.updatedBy
                        ? props.usersById[props.activeCall.updatedBy].fullname
                        : "N/A"}
                    </p>
                  </div>
                )
              : null}
            {!editProcedureState.isPostEdit && (
              <span>
                <button
                  className="vas-edit-procedure-record-header-btn"
                  onClick={resetForm}
                >
                  Reset Form
                </button>
                <button
                  className="vas-edit-procedure-record-header-btn"
                  onClick={returnToQueue}
                >
                  {editProcedureState.dressingChangeDate
                    ? "Return To Lines Tab"
                    : "Return To Queue"}
                </button>
              </span>
            )}
            {editProcedureState.isPostEdit && (
              <button
                className="vas-edit-procedure-record-header-btn"
                onClick={() => props.closeRecordCallback()}
              >
                Cancel Editing
              </button>
            )}
            <button
              className="vas-edit-procedure-record-header-btn vas-warn-btn"
              onClick={deleteCall}
            >
              Delete Call
            </button>
          </header>
          <div className="vas-edit-procedure-inner-container vas-edit-procedure-inner-container-main-comment">
            <header className="vas-edit-procedure-inner-container-header">
              <p className="vas-ml-5">Pre-Procedure Notes</p>
            </header>
            <div className="vas-edit-procedure-inner-container-notes">
              <div className="vas-edit-procedure-inner-container-main-inner">
                <div className="vas-edit-procedure-inner-container-row">
                  <DebounceInput
                    element="textarea"
                    className="vas-edit-procedure-add-comments"
                    debounceTimeout={750}
                    value={
                      props.activeCall.preComments
                        ? props.activeCall.preComments
                        : ""
                    }
                    onChange={(e) => {
                      inputLiveUpdate(e, "preComments");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {props.procedures.map((procedure, idx) => {
            return (
              <div
                className="vas-edit-procedure-inner-container"
                key={procedure._id}
              >
                <header className="vas-edit-procedure-inner-container-header">
                  <p
                    className="vas-edit-procedure-inner-container-section-name"
                    onClick={() => toggleShowSection(procedureMainRefs[idx])}
                  >
                    {procedure.name}
                  </p>
                  <button
                    className="vas-edit-procedure-reset-buttons"
                    onClick={() => {
                      resetSection(
                        procedureMainRefs[idx],
                        procedure.procedureId
                      );
                    }}
                  >
                    Reset
                  </button>
                </header>
                <div
                  ref={procedureMainRefs[idx]}
                  className="vas-edit-procedure-inner-container-main"
                >
                  <div className="vas-edit-procedure-inner-container-main-inner">
                    {procedure.groups.map((group, idx2) => {
                      let willDisable = false;
                      //disable selecting/deselecting line procedure options by normal users when editing a dressing change
                      if (
                        procedure.procedureId === 8 &&
                        props.activeCall.dressingChangeDate &&
                        props.user.role === "user"
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
                              onClick={toggleSectionDisplay}
                            >
                              {group.groupName}
                            </button>
                          )}
                          {!group.hideHeader && <h3>{group.groupName}</h3>}
                          <div
                            className={
                              "vas-edit-procedure-inner-container-row " +
                              (group.hideGroup
                                ? editProcedureState.isPostEdit
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
                                        id={itemId.toString()}
                                        name={
                                          procedure.procedureId +
                                          "_" +
                                          group.groupName.replace(/\s/g, "")
                                        }
                                        defaultChecked={
                                          props.activeCall.itemIds.indexOf(
                                            itemId
                                          ) > -1
                                            ? true
                                            : false
                                        }
                                        disabled={willDisable}
                                      />
                                      <label
                                        className="vas-btn"
                                        htmlFor={itemId.toString()}
                                        onClick={(e) => {
                                          selectButton(
                                            e,
                                            group.groupName,
                                            itemId
                                          );
                                        }}
                                      >
                                        {props.itemsById[itemId].value}
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
                                          changeCustomInput(
                                            e,
                                            group.fieldName,
                                            group.inputType
                                          );
                                        }}
                                        data-procedureid={procedure.procedureId}
                                        placeholder={
                                          props.itemsById[itemId].value
                                        }
                                        value={
                                          props.activeCall[group.fieldName]
                                        }
                                        id={itemId.toString()}
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
                  </div>
                  {procedure.procedureId === 4 && (
                    <span>
                      <div className="vas-edit-procedure-inner-container-row">
                        {/* <label className='vas-mt-15 vas-mb-5 vas-block'>{props.allOptions[1].name}:</label>Medical Record Number */}
                        <label className="vas-mt-15 vas-mb-5 vas-block">
                          Medical Record Number:
                        </label>
                        <DebounceInput
                          className="vas-custom-input"
                          debounceTimeout={750}
                          type="number"
                          value={
                            props.activeCall.mrn ? props.activeCall.mrn : ""
                          }
                          onChange={(e) => {
                            inputLiveUpdate(e, "mrn");
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
                            props.activeCall.patientName
                              ? props.activeCall.patientName
                              : ""
                          }
                          onChange={(e) => {
                            inputLiveUpdate(e, "patientName");
                          }}
                        />
                      </div>
                    </span>
                  )}
                  {procedure.procedureId === 8 && (
                    <span>
                      {props.activeCall.insertedBy && (
                        <span>
                          <p className="vas-edit-procedure-insertedBy-label">
                            Placement Inserted By:
                          </p>
                          <DebounceInput
                            type="text"
                            className="vas-input vas-custom-input vas-edit-procedure-insertedBy-input"
                            debounceTimeout={500}
                            value={props.activeCall.insertedBy}
                            onChange={(e) => {
                              inputLiveUpdate(e, "insertedBy");
                            }}
                          />
                        </span>
                      )}
                      {(editProcedureState.insertionTypeSelected ||
                        editProcedureState.isPostEdit ||
                        editProcedureState.isDressingChange) && (
                        <div>
                          <div className="vas-edit-procedure-inner-container-row">
                            {/* <h3>{props.allOptions[1].name}:</h3>Medical Record Number */}
                            <h3>Medical Record Number:</h3>
                            <DebounceInput
                              className="vas-custom-input"
                              debounceTimeout={750}
                              type="number"
                              value={
                                props.activeCall.mrn ? props.activeCall.mrn : ""
                              }
                              onChange={(e) => {
                                inputLiveUpdate(e, "mrn");
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
                                props.activeCall.patientName
                                  ? props.activeCall.patientName
                                  : ""
                              }
                              onChange={(e) => {
                                inputLiveUpdate(e, "patientName");
                              }}
                            />
                          </div>
                          <div className="vas-edit-procedure-inner-container-row">
                            {/* <h3>{props.allOptions[2].name}:</h3>Provider */}
                            <h3>Provider:</h3>
                            <DebounceInput
                              className="vas-custom-input"
                              debounceTimeout={750}
                              type="text"
                              value={
                                props.activeCall.provider
                                  ? props.activeCall.provider
                                  : ""
                              }
                              onChange={(e) => {
                                inputLiveUpdate(e, "provider");
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
                    editProcedureState.willSetDressingChangeDate && (
                      <span>
                        <div className="vas-edit-procedure-inner-container-row">
                          <h3>Future Dressing Change Date</h3>
                          <span className="vas-inline-block">
                            <DatePicker
                              className="vas-home-datepicker"
                              selected={editProcedureState.dressingChangeDate.toDate()}
                              onChange={dressingChangeDateOnChange}
                            />
                          </span>
                          <button
                            className="vas-home-save-date"
                            onClick={(e) => {
                              saveDressingChangeDate(e);
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
                onClick={() => toggleShowSection(orderMainRef)}
              >
                MD Order Change
              </p>
            </header>
            <div
              ref={orderMainRef}
              className="vas-edit-procedure-inner-container-main"
            >
              <div className="vas-edit-procedure-inner-container-main-inner">
                <select
                  className="vas-select"
                  value={
                    props.activeCall.orderChange
                      ? props.activeCall.orderChange
                      : ""
                  }
                  onChange={orderSelect}
                >
                  <option value="">Select An Order Change</option>
                  {props.orderChanges &&
                    props.orderChanges.options.map((option, idx) => {
                      return (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
          </div>
          <div className="vas-edit-procedure-inner-container vas-edit-procedure-order-change">
            <header className="vas-edit-procedure-inner-container-header">
              <p
                className="vas-edit-procedure-inner-container-section-name"
                onClick={() => toggleShowSection(consultationMainRef)}
              >
                Consultation
              </p>
              <button
                className="vas-edit-procedure-reset-buttons"
                onClick={() => resetSection(consultationMainRef)}
              >
                Reset
              </button>
            </header>
            <div
              ref={consultationMainRef}
              className="vas-edit-procedure-inner-container-main"
            >
              <div className="vas-edit-procedure-inner-container-main-inner">
                <input
                  type="checkbox"
                  className="vas-radio-select vas-edit-procedure-consultation-input"
                  id="consultation"
                  defaultChecked={props.activeCall.wasConsultation}
                  onChange={toggleConsultation}
                  name="consultation"
                />
                <label className="vas-btn" htmlFor="consultation">
                  Consultation Done
                </label>
              </div>
            </div>
          </div>
          <div className="vas-edit-procedure-inner-container">
            <header className="vas-edit-procedure-inner-container-header">
              <p
                className="vas-edit-procedure-inner-container-section-name"
                onClick={() => toggleShowSection(hospitalMainRef)}
              >
                Hospital
              </p>
            </header>
            <div
              ref={hospitalMainRef}
              className="vas-edit-procedure-inner-container-main vas-block"
            >
              <div className="vas-edit-procedure-inner-container-main-inner">
                <select
                  className="vas-select"
                  value={
                    props.activeCall.hospital ? props.activeCall.hospital : ""
                  }
                  onChange={hospitalChange}
                >
                  <option value="">Select A Hospital</option>
                  {props.hospitals &&
                    props.hospitals.map((subOption, idx2) => {
                      return (
                        <option key={subOption.id} value={subOption.id}>
                          {subOption.name}
                        </option>
                      );
                    })}
                </select>
                {props.activeCall.hospital === 6 && (
                  <div className="vas-edit-procedure-dob-container">
                    <h3>Patient Date of Birth (MM/DD/YYYY):</h3>
                    <span className="vas-inline-block">
                      <DatePicker
                        className="vas-home-datepicker"
                        selected={editProcedureState.dob.toDate()}
                        onChange={dobOnChange}
                      />
                    </span>
                    <button
                      className="vas-home-save-date"
                      onClick={saveDobDate}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="vas-edit-procedure-inner-container vas-edit-procedure-inner-container-main-comment">
            <header className="vas-edit-procedure-inner-container-header">
              <p className="vas-ml-5">Additional Comments</p>
            </header>
            <div className="vas-edit-procedure-inner-container-main vas-block">
              <div className="vas-edit-procedure-inner-container-main-inner">
                <DebounceInput
                  element="textarea"
                  className="vas-edit-procedure-add-comments"
                  debounceTimeout={750}
                  value={
                    props.activeCall.addComments
                      ? props.activeCall.addComments
                      : ""
                  }
                  onChange={(e) => {
                    inputLiveUpdate(e, "addComments");
                  }}
                />
              </div>
            </div>
          </div>
          {props.activeCall.dressingChangeDate &&
            !editProcedureState.closeLine && (
              <div className="vas-edit-procedure-inner-container vas-edit-procedure-important vas-block">
                <header className="vas-edit-procedure-inner-container-header">
                  <p>Close Line Type</p>
                </header>
                <div className="vas-edit-procedure-inner-container-main">
                  <div className="vas-edit-procedure-inner-container-main-inner">
                    <button
                      className="vas-btn-no"
                      onClick={(e) => {
                        closeLineType();
                      }}
                    >
                      Close Line Type
                    </button>
                  </div>
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
                  Current User: <b>{props.user.fullname}</b>
                </p>
                <p className="vas-edit-procedure-current-user-disclaimer">
                  If this is not you, please ensure you have logged the current
                  user out and logged back in with your own credentials
                </p>
                <button
                  className="vas-button vas-edit-procedure-complete-procedure-btn"
                  onClick={completeProcedure}
                >
                  {editProcedureState.isPostEdit
                    ? "Save Record"
                    : "Submit Procedure"}
                </button>
              </div>
            </div>
          </div>
        </span>
      )}
      {editProcedureState.modalIsOpen && (
        <Modal
          isConfirmation={editProcedureState.modalConfirmation}
          user={props.user}
          getConfirmation={getConfirmation}
          closeModal={closeModal}
          modalTitle={editProcedureState.modalTitle}
          modalMessage={editProcedureState.modalMessage}
        />
      )}
    </div>
  );
};

export default EditProcedure;
