import React, {
  ChangeEvent,
  Component,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { DebounceInput } from "react-debounce-input";
import helpers from "../util/helpers";
import { User } from "../types/User.type";
import { RefData } from "../pages";

interface AddCallState {
  customSelected: boolean;
  custom: string | undefined;
  preComments: string | undefined;
  roomNumber: string | undefined;
  need: string | undefined;
  needSelected: boolean;
  contact: string | undefined;
  status: number;
  hospital: string | undefined;
  isValidated: boolean;
  isExternalPlacement: boolean;
  insertedBy: string | undefined;
  insertionLength: number;
}

interface AddCallProps {
  user: User;
  callAdded: () => void;
}

const AddCall: React.FC<AddCallProps> = (props) => {
  const refData = useContext(RefData);
  const [addCallState, setAddCallState] = useState<AddCallState>({
    customSelected: false,
    custom: undefined,
    preComments: undefined,
    roomNumber: undefined,
    need: undefined,
    needSelected: false,
    contact: undefined,
    status: 1,
    hospital: undefined,
    isValidated: false,
    isExternalPlacement: false,
    insertedBy: undefined,
    insertionLength: 0,
  });

  useEffect(() => {
    validateAddCall();
  }, [
    addCallState.isExternalPlacement,
    addCallState.customSelected,
    addCallState.roomNumber,
    addCallState.custom,
    addCallState.contact,
  ]);

  const toggleStat = () => {
    if (addCallState.status === 1) {
      setAddCallState({ ...addCallState, status: 2 });
    } else {
      setAddCallState({ ...addCallState, status: 1 });
    }
  };

  const toggleExternalPlacement = () => {
    setAddCallState({
      ...addCallState,
      isExternalPlacement: !addCallState.isExternalPlacement,
    });
  };

  const handleNeedSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    let newStateValues: any = {};
    switch (e.target.value.toLowerCase()) {
      case "default":
        newStateValues = {
          need: undefined,
          customSelected: false,
        };
        break;
      case "custom":
        newStateValues = {
          need: e.target.value,
          customSelected: true,
        };
        break;
      default:
        newStateValues = {
          need: e.target.value,
          customSelected: false,
          custom: undefined,
        };
    }
    setAddCallState({ ...addCallState, ...newStateValues });
  };

  const hospitalSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    switch (e.target.value) {
      case "default":
        setAddCallState({ ...addCallState, hospital: "" });
        break;
      default:
        setAddCallState({ ...addCallState, hospital: e.target.value });
    }
  };

  const validateAddCall = () => {
    let isValidated = false;
    if (
      addCallState.roomNumber &&
      addCallState.roomNumber.length &&
      addCallState.need
    ) {
      if (addCallState.customSelected) {
        if (addCallState.custom?.length) {
          isValidated = true;
        } else {
          isValidated = false;
        }
      } else {
        isValidated = true;
      }
    } else {
      isValidated = false;
    }
    if (addCallState.isExternalPlacement) {
      if (!addCallState.insertedBy?.trim().length) {
        isValidated = false;
      }
    }
    setAddCallState({ ...addCallState, isValidated });
  };

  const addCall = () => {
    let call = {
      room: addCallState.roomNumber,
      job: addCallState.need,
      contact: addCallState.contact,
      createdAt: new Date().toISOString(),
      createdBy: props.user.userId,
      customJob: addCallState.custom?.trim().length
        ? addCallState.custom
        : undefined,
      preComments: addCallState.preComments?.trim().length
        ? addCallState.preComments
        : undefined,
      hospital: addCallState.hospital?.length
        ? Number(addCallState.hospital)
        : undefined,
      status: addCallState.status,
      isOpen: false,
      insertedBy: addCallState.insertedBy?.length
        ? addCallState.insertedBy
        : undefined,
      openBy: addCallState.insertedBy?.length ? props.user.userId : undefined,
      startTime: addCallState.insertedBy?.length
        ? new Date().toISOString()
        : undefined,
    };

    axios
      .post("/api/main", {
        call,
        path: "/add-call",
      })
      .then(() => {
        props.callAdded();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const onInsertionLengthChange = (e: ChangeEvent<HTMLInputElement>) => {
    let preComments = addCallState.preComments;
    preComments += e.target.value + "cm";
    setAddCallState({
      ...addCallState,
      insertionLength: Number(e.target.value),
      preComments,
    });
  };

  const onInsertionSelection = (itemId: number) => {
    //@ts-ignore
    let text = refData?.itemsById ? [itemId].value : "";
    let preComments = addCallState.preComments;
    preComments += text + ", ";
    setAddCallState({ ...addCallState, preComments });
  };

  const insertionProcedureData = refData?.proceduresById![8];

  return (
    <div className="vas-add-call">
      <div className="vas-add-call-scroll-container">
        <div className="vas-modal-add-call-row-block">
          <input
            type="checkbox"
            checked={addCallState.status === 2 ? true : false}
            className="vas-checkbox-select vas-modal-is-important-input"
            id="is-important"
            name="is-important"
          />
          <label
            className="vas-btn"
            htmlFor="is-important"
            onClick={toggleStat}
          >
            Needed Stat
          </label>
          <input
            type="checkbox"
            checked={addCallState.isExternalPlacement}
            className="vas-checkbox-select"
            id="external-placement"
            name="external-placement"
          />
          <label
            className="vas-btn"
            htmlFor="external-placement"
            onClick={toggleExternalPlacement}
          >
            External Placement
          </label>
        </div>
        {addCallState.isExternalPlacement && (
          <span>
            <div className="vas-modal-add-call-row">
              <div className="vas-modal-add-call-row-inner">
                <p>Placement Inserted By:</p>
                <DebounceInput
                  className="vas-modal-add-call-input"
                  minLength={1}
                  debounceTimeout={300}
                  value={addCallState.insertedBy}
                  onChange={(e) => {
                    setAddCallState({
                      ...addCallState,
                      insertedBy: e.target.value,
                    });
                  }}
                />
              </div>
            </div>
            {insertionProcedureData.groups.map((group) => {
              return (
                <span key={group._id}>
                  {group.groupName === "Insertion Type" && (
                    <div className="vas-modal-add-call-row">
                      <div className="vas-modal-add-call-row-inner">
                        <p>{group.groupName}:</p>
                        {group.groupItems.map((itemId: number, idx: number) => {
                          return (
                            <span key={itemId + idx}>
                              <input
                                type={group.inputType}
                                name={group.groupName.replace(/\s/g, "")}
                                id={String(itemId)}
                                className={
                                  "vas-edit-procedure-select-input vas-" +
                                  group.inputType +
                                  "-select"
                                }
                              />
                              <label
                                className="vas-btn"
                                htmlFor={String(itemId)}
                                onClick={() => {
                                  onInsertionSelection(itemId);
                                }}
                              >
                                {refData?.itemsById
                                  ? //@ts-ignore
                                    [itemId].value
                                  : ""}
                              </label>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {group.groupName === "Vessel" && (
                    <div className="vas-modal-add-call-row">
                      <div className="vas-modal-add-call-row-inner">
                        <p>{group.groupName}:</p>
                        {group.groupItems.map((itemId, idx) => {
                          return (
                            <span key={itemId + idx}>
                              <input
                                type={group.inputType}
                                id={String(itemId)}
                                name={group.groupName.replace(/\s/g, "")}
                                className={
                                  "vas-edit-procedure-select-input vas-" +
                                  group.inputType +
                                  "-select"
                                }
                              />
                              <label
                                className="vas-btn"
                                htmlFor={String(itemId)}
                                onClick={(e) => {
                                  onInsertionSelection(itemId);
                                }}
                              >
                                {refData?.itemsById
                                  ? //@ts-ignore
                                    [itemId].value
                                  : ""}
                              </label>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {group.groupName === "Laterality" && (
                    <div className="vas-modal-add-call-row">
                      <div className="vas-modal-add-call-row-inner">
                        <p>{group.groupName}:</p>
                        {group.groupItems.map((itemId, idx) => {
                          return (
                            <span key={itemId + idx}>
                              <input
                                type={group.inputType}
                                id={String(itemId)}
                                name={group.groupName.replace(/\s/g, "")}
                                className={
                                  "vas-edit-procedure-select-input vas-" +
                                  group.inputType +
                                  "-select"
                                }
                              />
                              <label
                                className="vas-btn"
                                htmlFor={String(itemId)}
                                onClick={(e) => {
                                  onInsertionSelection(
                                    refData?.itemsById
                                      ? //@ts-ignore
                                        [itemId].value
                                      : ""
                                  );
                                }}
                              >
                                {refData?.itemsById
                                  ? //@ts-ignore
                                    [itemId].value
                                  : ""}
                              </label>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {group.groupName === "Insertion Length" && (
                    <div className="vas-modal-add-call-row">
                      <div className="vas-modal-add-call-row-inner">
                        <p>{group.groupName}:</p>
                        {group.groupItems.map((itemId, idx) => {
                          return (
                            <span key={itemId + idx}>
                              <DebounceInput
                                type={group.inputType}
                                debounceTimeout={1000}
                                className={
                                  "vas-custom-input vas-" +
                                  group.inputType +
                                  "-select"
                                }
                                placeholder={
                                  refData?.itemsById
                                    ? //@ts-ignore
                                      [itemId].value
                                    : ""
                                }
                                onChange={onInsertionLengthChange}
                                value={
                                  addCallState.insertionLength < 1
                                    ? ""
                                    : addCallState.insertionLength
                                }
                                id={itemId}
                              />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </span>
              );
            })}
          </span>
        )}
        <div className="vas-modal-add-call-row">
          <div className="vas-modal-add-call-row-inner">
            <p>Room:</p>
            <DebounceInput
              className="vas-modal-add-call-input"
              minLength={1}
              debounceTimeout={300}
              onChange={(e) => {
                setAddCallState({
                  ...addCallState,
                  roomNumber: e.target.value,
                });
              }}
            />
          </div>
          <div className="vas-modal-add-call-row-inner">
            <p>Need:</p>
            <select
              className="vas-modal-add-call-input"
              onChange={handleNeedSelect}
            >
              <option value="default">Select Need</option>
              {refData.callNeeds?.options?.map((option) => {
                return <option key={option.id}>{option.name}</option>;
              })}
            </select>
          </div>
          {addCallState.customSelected && (
            <div className="vas-modal-add-call-row-inner">
              <p>Custom Name:</p>
              <input
                className="vas-modal-add-call-input vas-modal-custom-input"
                type="text"
                value={addCallState.custom}
                onChange={(e) => {
                  setAddCallState({ ...addCallState, custom: e.target.value });
                }}
              />
            </div>
          )}
          <div className="vas-modal-add-call-row-inner">
            <p>Hospital:</p>
            <select
              className="vas-modal-add-call-input"
              onChange={hospitalSelect}
            >
              <option value="default">Select Hospital</option>
              {refData.hospitals?.options?.map((option) => {
                return (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="vas-modal-add-call-row-inner">
            <p>Contact:</p>
            <input
              type="text"
              className="vas-modal-add-call-input"
              value={addCallState.contact}
              onChange={(e) => {
                setAddCallState({ ...addCallState, contact: e.target.value });
              }}
            />
          </div>
          <div className="vas-modal-add-call-row-block">
            <p>Pre-Procedure Notes:</p>
            <textarea
              className="vas-modal-add-call-textarea"
              value={addCallState.preComments}
              onChange={(e) => {
                setAddCallState({
                  ...addCallState,
                  preComments: e.target.value,
                });
              }}
            ></textarea>
          </div>
        </div>
      </div>
      {addCallState.isValidated && (
        <div className="vas-add-call-confirmation-container">
          <button className="vas-warn-btn">Cancel</button>
          <button
            className="vas-confirm"
            onClick={(e) => {
              addCall();
            }}
          >
            Add To Queue
          </button>
        </div>
      )}
    </div>
  );
};

export default AddCall;
