import React, { Component } from "react";
import Moment from "react-moment";
import helpers from "../util/helpers";
import printIcon from "../public/print.svg";
import externalIcon from "../public/external.svg";

export default class ReturnedProcedures extends Component {
  constructor(props) {
    super(props);
    this.state = {
      completedCalls: this.props.completedCalls,
      hospitalAgg: this.props.hospitalAgg,
      insertionAgg: this.props.insertionAgg,
    };
    this.toggleSort = this.toggleSort.bind(this);
    this.sortByOnChange = this.sortByOnChange.bind(this);
    this.aggregateData = this.aggregateData.bind(this);
    this.toggleShowRecord = this.toggleShowRecord.bind(this);
  }

  componentDidMount() {
    console.log(this.props);
    this.aggregateData();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(
      {
        insertionAgg: nextProps.insertionAgg,
        hospitalAgg: nextProps.hospitalAgg,
        completedCalls: nextProps.completedCalls,
      },
      this.aggregateData
    );
  }

  aggregateData() {
    let completedCalls = this.state.completedCalls;
    let hospitalObj = {};

    completedCalls.forEach((procedure, idx) => {
      //aggregate hospitals
      if (hospitalObj.hasOwnProperty(procedure.hospital)) {
        hospitalObj[procedure.hospital].count += 1;
      } else {
        hospitalObj[procedure.hospital] = {
          text: procedure.hospitalName,
          count: 0,
        };
      }
    });
  }

  sortByOnChange(e) {
    let completedCalls = this.state.completedCalls;
    if (e.target.value !== "callTime") {
      completedCalls.sort((a, b) => {
        if (a[e.target.value] < b[e.target.value]) return -1;
        if (a[e.target.value] > b[e.target.value]) return 1;
        return 0;
      });
      this.setState({ completedCalls });
    } else {
      completedCalls.sort((a, b) => {
        if (
          helpers.getDateFromObjectId(a._id) >
          helpers.getDateFromObjectId(b._id)
        )
          return -1;
        if (
          helpers.getDateFromObjectId(a._id) <
          helpers.getDateFromObjectId(b._id)
        )
          return 1;
        return 0;
      });
    }
  }

  toggleSort() {
    let completedCalls = this.state.completedCalls;
    completedCalls.reverse();
    this.setState({ completedCalls });
  }

  toggleShowRecord(e) {
    let showToggleContainer = e.target.closest(
      ".vas-returned-procedures-show-hide-toggle-container"
    );
    showToggleContainer
      .querySelector(".vas-returned-procedures-show-hide-toggle-icon")
      .classList.toggle("vas-rotate-180");
    showToggleContainer.nextSibling.classList.toggle("vas-hide");
  }

  render() {
    return (
      <div className="vas-table vas-returned-procedures-table">
        {this.state.completedCalls.length < 1 && (
          <div className="vas-returned-procedures-no-calls-container">
            <p>No completed calls for that query</p>
          </div>
        )}
        {this.props.isAdmin && (
          <span>
            <div className="vas-returned-procedures-aggregations">
              <p className="vas-returned-procedures-records-returned">
                {this.state.completedCalls.length} Records Returned
              </p>
              <div className="vas-returned-procedures-aggregations-insertions-container">
                {this.state.insertionAgg.map((insertion) => {
                  console.log(insertion);
                  return (
                    <div
                      key={insertion.index}
                      className="vas-returned-procedures-aggregations-insertions-item"
                    >
                      <p className="vas-returned-procedures-aggregations-insertions-item-left">
                        {this.props.itemsById[insertion.itemId].value}
                      </p>
                      <p className="vas-returned-procedures-aggregations-insertions-item-right">
                        {insertion.count}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </span>
        )}
        {!this.props.hideUI && this.state.completedCalls.length > 0 && (
          <span className="vas-returned-procedures-outer">
            <div className="vas-table-thead-row vas-home-completed-thead">
              <select
                className="vas-select vas-returned-procedures-sortby-select"
                onChange={this.sortByOnChange}
              >
                <option value="callTime">Call Created Time</option>
                <option value="hospitalName">Hospital</option>
                <option value="completedByName">Nurse</option>
                <option value="completedAt">Completion Time</option>
                <option value="responseTime">Response Time</option>
                <option value="procedureTime">Procedure Time</option>
                <option value="startTime">Start Time</option>
                <option value="orderChange">Order Change</option>
                <option value="wasConsultation">Was Consultation</option>
                <option value="status">Status</option>
                <option value="room">Room</option>
                <option value="mrn">MRN</option>
              </select>
              <button
                className="vas-btn-normal vas-home-reverse-sort-btn"
                onClick={this.toggleSort}
              >
                Reverse Sort
              </button>
              {this.props.isAdmin && (
                <img
                  className="vas-returned-procedures-print"
                  src={printIcon}
                  alt="print"
                  onClick={(e) => {
                    window.print();
                  }}
                />
              )}
            </div>
            <div className="vas-home-table-body">
              {this.state.completedCalls.length < 1 && (
                <div>
                  <p className="vas-queue-no-items">
                    There are no completed items yet for today
                  </p>
                </div>
              )}
              {this.props.hospitalsById &&
                this.props.orderChangeById &&
                this.props.proceduresById &&
                this.props.itemsById &&
                this.state.completedCalls.map((call) => {
                  let responseTimeHr =
                    Math.floor(call.responseTime / 3600000) % 24;
                  let responseTimeMin =
                    Math.floor(call.responseTime / 60000) % 60;
                  let procedureTimeHr =
                    Math.floor(call.procedureTime / 3600000) % 24;
                  let procedureTimeMin =
                    Math.floor(call.procedureTime / 60000) % 60;
                  return (
                    <div
                      className="vas-admin-custom-table-item-outer-container"
                      key={call._id}
                    >
                      {this.props.isAdmin && (
                        <div className="vas-returned-procedures-show-hide-toggle-container">
                          <p
                            className="vas-returned-procedures-show-hide-toggle-icon"
                            onClick={this.toggleShowRecord}
                          >
                            &#9660;
                          </p>
                        </div>
                      )}
                      <div
                        className="vas-admin-custom-table-item-outer"
                        onClick={(e) => {
                          this.props.editCompletedCall(
                            call._id,
                            call.completedBy,
                            call.dressingChangeDate
                          );
                        }}
                      >
                        <div className="vas-admin-custom-table-item-outer">
                          <div className="vas-admin-custom-table-item vas-call-table-item">
                            <div className="vas-home-custom-table-column-1">
                              <Moment
                                className="vas-returned-procedures-time-hour-min"
                                format="HH:mm"
                              >
                                {helpers.getDateFromObjectId(call._id)}
                              </Moment>
                              <Moment
                                className="vas-returned-procedures-time-month-day"
                                format="M/D"
                              >
                                {helpers.getDateFromObjectId(call._id)}
                              </Moment>
                            </div>
                            <div
                              className={
                                "vas-home-custom-table-column-2 " +
                                (call.orderChange
                                  ? "vas-admin-order-change"
                                  : "")
                              }
                            >
                              <div className="vas-admin-custom-table-td vas-admin-custom-table-nurse">
                                <p className="vas-admin-custom-item-subfield">
                                  Nurse:
                                </p>
                                <p className="vas-admin-custom-item-subvalue">
                                  {this.props.usersById[call.completedBy]
                                    ? this.props.usersById[call.completedBy]
                                        .fullname
                                    : call.completedBy}
                                </p>
                              </div>
                              <div className="vas-admin-custom-table-td vas-admin-custom-table-room">
                                <p className="vas-admin-custom-item-subfield">
                                  Room:
                                </p>
                                <p className="vas-admin-custom-item-subvalue vas-uppercase">
                                  {call.room}
                                </p>
                              </div>
                              <span>
                                <div className="vas-admin-custom-table-td vas-admin-custom-table-hospital">
                                  <p className="vas-admin-custom-item-subfield">
                                    Hospital:
                                  </p>
                                  <p className="vas-admin-custom-item-subvalue">
                                    {call.hospital
                                      ? this.props.hospitalsById[call.hospital]
                                          .name
                                      : "N/A"}
                                  </p>
                                </div>
                                {call.hospital === 6 &&
                                  call.dob !== null && ( //if Siskin, and DOB exists
                                    <div className="vas-admin-custom-table-td vas-admin-custom-table-hospital">
                                      <p className="vas-admin-custom-item-subfield">
                                        Patient DOB:
                                      </p>
                                      <p className="vas-admin-custom-item-subvalue">
                                        <Moment format="MM/DD/YYYY">
                                          {call.dob}
                                        </Moment>
                                      </p>
                                    </div>
                                  )}
                                <div className="vas-admin-custom-table-td vas-admin-custom-table-mrn">
                                  <p className="vas-admin-custom-item-subfield">
                                    MRN:
                                  </p>
                                  <p className="vas-admin-custom-item-subvalue">
                                    {call.mrn ? call.mrn : "N/A"}
                                  </p>
                                </div>
                                {call.patientName && (
                                  <div className="vas-admin-custom-table-td vas-admin-custom-table-mrn">
                                    <p className="vas-admin-custom-item-subfield">
                                      Patient:
                                    </p>
                                    <p className="vas-admin-custom-item-subvalue">
                                      {call.patientName}
                                    </p>
                                  </div>
                                )}
                                <div className="vas-admin-custom-table-td vas-admin-custom-table-provider">
                                  <p className="vas-admin-custom-item-subfield">
                                    Provider:
                                  </p>
                                  <p className="vas-admin-custom-item-subvalue">
                                    {call.provider ? call.provider : "N/A"}
                                  </p>
                                </div>
                                {call.orderChange && (
                                  <div className="vas-admin-custom-table-td vas-admin-custom-table-order-change">
                                    <p className="vas-admin-custom-item-subfield">
                                      Order Change:
                                    </p>
                                    <p className="vas-admin-custom-item-subvalue">
                                      {
                                        this.props.orderChangeById[
                                          call.orderChange
                                        ].name
                                      }
                                    </p>
                                  </div>
                                )}
                              </span>
                            </div>
                            <div className="vas-home-custom-table-column-3">
                              <div className="vas-call-times-row">
                                <p className="vas-call-times-left">
                                  Call Time:
                                </p>
                                <p className="vas-call-times-right">
                                  <Moment format="HH:mm">
                                    {call.createdAt}
                                  </Moment>
                                </p>
                              </div>
                              <div className="vas-call-times-row">
                                <p className="vas-call-times-left">
                                  Start Time:
                                </p>
                                <p className="vas-call-times-right">
                                  <Moment format="HH:mm">
                                    {call.startTime}
                                  </Moment>
                                </p>
                              </div>
                              <div className="vas-call-times-row">
                                <p className="vas-call-times-left">End Time:</p>
                                <p className="vas-call-times-right">
                                  <Moment format="HH:mm">
                                    {call.completedAt}
                                  </Moment>
                                </p>
                              </div>
                              <div className="vas-call-times-row">
                                <p className="vas-call-times-left">
                                  Response Time:
                                </p>
                                <p className="vas-call-times-right">
                                  {responseTimeHr > 0
                                    ? responseTimeHr + " Hr "
                                    : ""}
                                  {responseTimeMin + " Min"}
                                </p>
                              </div>
                              <div className="vas-call-times-row">
                                <p className="vas-call-times-left">
                                  Procedure Time:
                                </p>
                                <p className="vas-call-times-right">
                                  {procedureTimeHr > 0
                                    ? procedureTimeHr + " Hr "
                                    : ""}
                                  {procedureTimeMin + " Min"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="vas-home-custom-table-item-column-procedures">
                            <div className="vas-admin-custom-table-td vas-admin-custom-table-procedures">
                              {call.proceduresDone.map((procedure, idx) => {
                                return (
                                  <div
                                    className="vas-admin-query-procedure-container"
                                    key={procedure.procedureId}
                                  >
                                    <div className="vas-admin-query-procedure-header">
                                      <p className="vas-admin-query-procedure-names">
                                        {
                                          this.props.proceduresById[
                                            procedure.procedureId
                                          ].name
                                        }
                                      </p>
                                      {call.insertedBy && (
                                        <img
                                          className="vas-returned-procedures-external"
                                          src={externalIcon}
                                          alt="external"
                                        />
                                      )}
                                    </div>
                                    <div className="vas-admin-query-item-container">
                                      {procedure.itemIds &&
                                        procedure.itemIds.length > 0 &&
                                        procedure.itemIds.map((id, idx) => {
                                          let isCustom =
                                            this.props.itemsById[id].isCustom;
                                          return (
                                            <div
                                              key={id + "_" + idx}
                                              className="vas-admin-query-item"
                                            >
                                              <p className="vas-returned-procedures-query-item-left">
                                                {this.props.itemsById[id]
                                                  .groupName !==
                                                this.props.itemsById[id].value
                                                  ? this.props.itemsById[id]
                                                      .groupName + ":"
                                                  : ""}
                                              </p>
                                              <p className="vas-returned-procedures-query-item-right">
                                                {!isCustom
                                                  ? this.props.itemsById[id]
                                                      .value
                                                  : this.props.itemsById[id]
                                                      .valuePrefix +
                                                    call[
                                                      this.props.itemsById[id]
                                                        .fieldName
                                                    ] +
                                                    this.props.itemsById[id]
                                                      .valueSuffix}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      {call.insertedBy && (
                                        <div className="vas-admin-query-item vas-admin-query-item-insertedBy">
                                          <p className="vas-returned-procedures-query-item-left">
                                            Inserted By:
                                          </p>
                                          <p className="vas-returned-procedures-query-item-right">
                                            {call.insertedBy}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        {call.wasConsultation && (
                          <div className="vas-call-consultation-container">
                            <p className="vas-call-consultation">
                              Consultation Done
                            </p>
                          </div>
                        )}
                        {call.dressingChangeDate && (
                          <div className="vas-call-dressing-change-container">
                            <p className="vas-call-dressing-change">
                              Dressing Changed On:{" "}
                              <Moment format="M/D">
                                {call.dressingChangeDate}
                              </Moment>
                            </p>
                          </div>
                        )}
                        {(call.addComments || call.preComments) && (
                          <div className="vas-call-comments-container">
                            {call.preComments && (
                              <p className="vas-call-comment">
                                <b>Pre-Procedure:</b> {call.preComments}
                              </p>
                            )}
                            {call.addComments && (
                              <p className="vas-call-comment">
                                <b>Add'l:</b> {call.addComments}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </span>
        )}
      </div>
    );
  }
}
