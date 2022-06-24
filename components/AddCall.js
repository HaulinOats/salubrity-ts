import React, { Component } from "react";
import axios from "axios";
import { DebounceInput } from "react-debounce-input";
import helpers from "../util/helpers";

export default class AddCall extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allOptions: [],
      callNeeds: [],
      hospitals: [],
      customSelected: false,
      custom: "",
      preComments: "",
      roomNumber: null,
      need: "",
      needSelected: false,
      contact: "",
      status: 1,
      hospital: "",
      isValidated: false,
      insertionProcedureData: null,
      isExternalPlacement: false,
      insertedBy: "",
      insertionLength: 0,
    };
    this.handleNeedSelect = this.handleNeedSelect.bind(this);
    this.hospitalSelect = this.hospitalSelect.bind(this);
    this.toggleStat = this.toggleStat.bind(this);
    this.toggleExternalPlacement = this.toggleExternalPlacement.bind(this);
    this.onInsertionLengthChange = this.onInsertionLengthChange.bind(this);
  }

  componentDidMount() {
    helpers
      .getOptionsData()
      .then((resp) => {
        this.setState({
          allOptions: resp.options,
          callNeeds: resp.callNeeds,
          hospitals: resp.hospitals,
        });
      })
      .catch((err) => {
        console.log(err);
      });

    helpers
      .getProcedureData()
      .then((data) => {
        this.setState(
          {
            insertionProcedureData: data.proceduresById["8"],
          },
          () => {
            // console.log(this.state);
          }
        );
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
  }

  toggleStat() {
    if (this.state.status === 1) {
      this.setState({ status: 2 });
    } else {
      this.setState({ status: 1 });
    }
  }

  toggleExternalPlacement() {
    this.setState(
      { isExternalPlacement: !this.state.isExternalPlacement },
      this.validateAddCall
    );
  }

  handleNeedSelect(e) {
    switch (e.target.value.toLowerCase()) {
      case "default":
        this.setState(
          { need: "", customSelected: false },
          this.validateAddCall
        );
        break;
      case "custom":
        this.setState(
          {
            need: e.target.value,
            customSelected: true,
          },
          this.validateAddCall
        );
        break;
      default:
        this.setState(
          { need: e.target.value, customSelected: false, custom: "" },
          this.validateAddCall
        );
    }
  }

  hospitalSelect(e) {
    switch (e.target.value) {
      case "default":
        this.setState({ hospital: "" });
        break;
      default:
        this.setState({ hospital: e.target.value });
    }
  }

  validateAddCall() {
    let isValidated = false;
    if (
      this.state.roomNumber &&
      this.state.roomNumber.length &&
      this.state.need
    ) {
      if (this.state.customSelected) {
        if (this.state.custom.length) {
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
    if (this.state.isExternalPlacement) {
      if (!this.state.insertedBy.trim().length) {
        isValidated = false;
      }
    }
    this.setState({ isValidated });
  }

  addCall() {
    let addQuery = {
      room: this.state.roomNumber,
      job: this.state.need,
      contact: this.state.contact,
      createdAt: new Date().toISOString(),
      createdBy: this.props.currentUser.userId,
      customJob: this.state.custom.trim().length ? this.state.custom : null,
      preComments: this.state.preComments.trim().length
        ? this.state.preComments
        : null,
      hospital: this.state.hospital.length ? Number(this.state.hospital) : null,
      status: this.state.status,
      isOpen: false,
      insertedBy: this.state.insertedBy.length ? this.state.insertedBy : null,
      openBy: this.state.insertedBy.length
        ? this.props.currentUser.userId
        : null,
      startTime: this.state.insertedBy.length ? new Date().toISOString() : null,
    };

    axios
      .post("/add-call", addQuery)
      .then((resp) => {
        this.props.callAdded(resp.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  onInsertionLengthChange(e) {
    let preComments = this.state.preComments;
    preComments += e.target.value + "cm";
    this.setState(
      {
        insertionLength: e.target.value,
        preComments,
      },
      () => {}
    );
  }

  onInsertionSelection(text) {
    let preComments = this.state.preComments;
    preComments += text + ", ";
    this.setState({ preComments });
  }

  render() {
    return (
      <div className="vas-add-call">
        <div className="vas-add-call-scroll-container">
          <div className="vas-modal-add-call-row-block">
            <input
              type="checkbox"
              checked={this.state.status === 2 ? true : false}
              className="vas-checkbox-select vas-modal-is-important-input"
              id="is-important"
              name="is-important"
            />
            <label
              className="vas-btn"
              htmlFor="is-important"
              onClick={this.toggleStat}
            >
              Needed Stat
            </label>
            <input
              type="checkbox"
              checked={this.state.isExternalPlacement}
              className="vas-checkbox-select"
              id="external-placement"
              name="external-placement"
            />
            <label
              className="vas-btn"
              htmlFor="external-placement"
              onClick={this.toggleExternalPlacement}
            >
              External Placement
            </label>
          </div>
          {this.state.isExternalPlacement && (
            <span>
              <div className="vas-modal-add-call-row">
                <div className="vas-modal-add-call-row-inner">
                  <p>Placement Inserted By:</p>
                  <DebounceInput
                    className="vas-modal-add-call-input"
                    minLength={1}
                    debounceTimeout={300}
                    value={this.state.insertedBy}
                    onChange={(e) => {
                      this.setState(
                        { insertedBy: e.target.value },
                        this.validateAddCall
                      );
                    }}
                  />
                </div>
              </div>
              {this.state.insertionProcedureData.groups.map((group) => {
                return (
                  <span key={group._id}>
                    {group.groupName === "Insertion Type" && (
                      <div className="vas-modal-add-call-row">
                        <div className="vas-modal-add-call-row-inner">
                          <p>{group.groupName}:</p>
                          {group.groupItems.map((itemId, idx) => {
                            return (
                              <span key={itemId + idx}>
                                <input
                                  type={group.inputType}
                                  name={group.groupName.replace(/\s/g, "")}
                                  id={itemId}
                                  className={
                                    "vas-edit-procedure-select-input vas-" +
                                    group.inputType +
                                    "-select"
                                  }
                                />
                                <label
                                  className="vas-btn"
                                  htmlFor={itemId}
                                  onClick={(e) => {
                                    this.onInsertionSelection(
                                      this.state.itemsById[itemId].value
                                    );
                                  }}
                                >
                                  {this.state.itemsById[itemId].value}
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
                                  id={itemId}
                                  name={group.groupName.replace(/\s/g, "")}
                                  className={
                                    "vas-edit-procedure-select-input vas-" +
                                    group.inputType +
                                    "-select"
                                  }
                                />
                                <label
                                  className="vas-btn"
                                  htmlFor={itemId}
                                  onClick={(e) => {
                                    this.onInsertionSelection(
                                      this.state.itemsById[itemId].value
                                    );
                                  }}
                                >
                                  {this.state.itemsById[itemId].value}
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
                                  id={itemId}
                                  name={group.groupName.replace(/\s/g, "")}
                                  className={
                                    "vas-edit-procedure-select-input vas-" +
                                    group.inputType +
                                    "-select"
                                  }
                                />
                                <label
                                  className="vas-btn"
                                  htmlFor={itemId}
                                  onClick={(e) => {
                                    this.onInsertionSelection(
                                      this.state.itemsById[itemId].value
                                    );
                                  }}
                                >
                                  {this.state.itemsById[itemId].value}
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
                                    this.state.itemsById[itemId].value
                                  }
                                  onChange={this.onInsertionLengthChange}
                                  value={
                                    this.state.insertionLength < 1
                                      ? ""
                                      : this.state.insertionLength
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
                  this.setState(
                    { roomNumber: e.target.value },
                    this.validateAddCall
                  );
                }}
              />
            </div>
            <div className="vas-modal-add-call-row-inner">
              <p>Need:</p>
              <select
                className="vas-modal-add-call-input"
                onChange={this.handleNeedSelect}
              >
                <option value="default">Select Need</option>
                {this.state.callNeeds &&
                  this.state.callNeeds.map((option) => {
                    return <option key={option.id}>{option.name}</option>;
                  })}
              </select>
            </div>
            {this.state.customSelected && (
              <div className="vas-modal-add-call-row-inner">
                <p>Custom Name:</p>
                <input
                  className="vas-modal-add-call-input vas-modal-custom-input"
                  type="text"
                  value={this.state.custom}
                  onChange={(e) => {
                    this.setState(
                      { custom: e.target.value },
                      this.validateAddCall
                    );
                  }}
                />
              </div>
            )}
            <div className="vas-modal-add-call-row-inner">
              <p>Hospital:</p>
              <select
                className="vas-modal-add-call-input"
                onChange={this.hospitalSelect}
              >
                <option value="default">Select Hospital</option>
                {this.state.hospitals &&
                  this.state.hospitals.map((option) => {
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
                value={this.state.contact}
                onChange={(e) => {
                  this.setState(
                    { contact: e.target.value },
                    this.validateAddCall
                  );
                }}
              />
            </div>
            <div className="vas-modal-add-call-row-block">
              <p>Pre-Procedure Notes:</p>
              <textarea
                className="vas-modal-add-call-textarea"
                value={this.state.preComments}
                onChange={(e) => {
                  this.setState({ preComments: e.target.value });
                }}
              ></textarea>
            </div>
          </div>
        </div>
        {this.state.isValidated && (
          <div className="vas-add-call-confirmation-container">
            <button className="vas-warn-btn">Cancel</button>
            <button
              className="vas-confirm"
              onClick={(e) => {
                this.addCall();
              }}
            >
              Add To Queue
            </button>
          </div>
        )}
      </div>
    );
  }
}
