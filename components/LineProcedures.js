import React, { Component } from "react";
import Moment from "react-moment";
import moment from "moment";

export default class LineProcedures extends Component {
  render() {
    let today = moment();
    //UPDATE
    let lineTypes = [30, 58, 59, 60, 61, 62, 90];
    let lateralities = [68, 69];
    return (
      <div className="vas-line-procedures">
        <div className="vas-line-procedures-table">
          <header className="vas-line-procedures-table-header">
            <label>Sort By: </label>
            <select
              className="vas-select"
              onChange={this.props.linesSortByOnChange}
            >
              <option value="dressingChangeDate">Dressing Change Date</option>
              <option value="createdAt">Insertion Date</option>
              <option value="mrn">MRN</option>
              <option value="room">Room</option>
            </select>
            <button
              className="vas-line-procedures-table-header-reverse"
              onClick={(e) => {
                this.props.reverseSort("lines");
              }}
            >
              Reverse Sort
            </button>
          </header>
          {this.props.lineProcedures.length < 1 && (
            <p className="vas-line-procedures-no-calls">
              There are no open lines types at this time
            </p>
          )}
          {this.props.lineProcedures.map((lineProcedure, idx) => {
            let daysTilDressingDate = moment(
              lineProcedure.dressingChangeDate
            ).diff(today, "days");
            let lineType = "N/A";
            let laterality = "N/A";
            lineProcedure.itemIds.forEach((itemId) => {
              if (lineTypes.indexOf(itemId) > -1) {
                lineType = this.props.itemsById[itemId].value;
              }
              if (lateralities.indexOf(itemId) > -1) {
                laterality = this.props.itemsById[itemId].value;
              }
            });
            return (
              <div
                key={lineProcedure._id + idx}
                className={
                  "vas-line-procedures-line-item " +
                  (daysTilDressingDate < 2
                    ? "vas-line-procedure-line-item-attention "
                    : "") +
                  (lineProcedure.isHidden
                    ? "vas-line-procedure-line-item-hidden"
                    : "")
                }
                onClick={(e) => {
                  this.props.editCompletedCall(
                    lineProcedure._id,
                    lineProcedure.completedBy,
                    lineProcedure.dressingChangeDate
                  );
                }}
              >
                <div className="vas-line-procedures-line-item-left">
                  <Moment
                    className="vas-line-procedures-main-date"
                    format="M/D"
                  >
                    {lineProcedure.dressingChangeDate}
                  </Moment>
                  <p
                    className={
                      "vas-line-procedures-open-status vas-open-status " +
                      (lineProcedure.openBy ? "vas-open-label-blink" : "")
                    }
                  >
                    {lineProcedure.openBy ? "OPEN" : ""}
                  </p>
                </div>
                <div className="vas-line-procedures-line-item-right">
                  <div className="vas-line-procedures-line-item-field-container">
                    <p className="vas-line-procedures-line-item-field-container-left">
                      Room:
                    </p>
                    <p className="vas-line-procedures-line-item-field-container-right vas-uppercase">
                      {lineProcedure.room}
                    </p>
                  </div>
                  <div className="vas-line-procedures-line-item-field-container">
                    <p className="vas-line-procedures-line-item-field-container-left">
                      Hospital:
                    </p>
                    <p className="vas-line-procedures-line-item-field-container-right">
                      {this.props.hospitalsById[lineProcedure.hospital]
                        ? this.props.hospitalsById[lineProcedure.hospital].name
                        : "N/A"}
                    </p>
                  </div>
                  <div className="vas-line-procedures-line-item-field-container">
                    <p className="vas-line-procedures-line-item-field-container-left">
                      Type:
                    </p>
                    <p className="vas-line-procedures-line-item-field-container-right">
                      {lineType}
                    </p>
                  </div>
                  <div className="vas-line-procedures-line-item-field-container">
                    <p className="vas-line-procedures-line-item-field-container-left">
                      Laterality:
                    </p>
                    <p className="vas-line-procedures-line-item-field-container-right">
                      {laterality}
                    </p>
                  </div>
                  <div className="vas-line-procedures-line-item-field-container">
                    <p className="vas-line-procedures-line-item-field-container-left">
                      MRN:
                    </p>
                    <p className="vas-line-procedures-line-item-field-container-right">
                      {lineProcedure.mrn}
                    </p>
                  </div>
                  <div className="vas-line-procedures-line-item-field-container">
                    <p className="vas-line-procedures-line-item-field-container-left">
                      Insertion Date:
                    </p>
                    <p className="vas-line-procedures-line-item-field-container-right">
                      <Moment format="M/D">{lineProcedure.createdAt}</Moment>
                    </p>
                  </div>
                  {/* <div className='vas-line-procedures-line-item-field-container'>
                    <p className='vas-line-procedures-line-item-field-container-left'>Updated By:</p>
                    <p className='vas-line-procedures-line-item-field-container-right vas-capitalize'>{lineProcedure.updatedBy ? this.props.usersById[lineProcedure.updatedBy].fullname : this.props.usersById[lineProcedure.completedBy].fullname}</p>
                  </div>
                  <div className='vas-line-procedures-line-item-field-container'>
                    <p className='vas-line-procedures-line-item-field-container-left'>Updated At:</p>
                    <p className='vas-line-procedures-line-item-field-container-right'><Moment format='M/D HH:mm'>{lineProcedure.updatedAt ? lineProcedure.updatedAt : lineProcedure.completedAt}</Moment></p>
                  </div> */}
                  {/* <div className='vas-line-procedures-line-item-field-container'>
                    <p className='vas-line-procedures-line-item-field-container-left'>Dressing Date:</p>
                    <p className='vas-line-procedures-line-item-field-container-right'><Moment format='M/D'>{lineProcedure.dressingChangeDate}</Moment></p>
                  </div> */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
