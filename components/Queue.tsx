import React, { useContext } from "react";
import helpers from "../util/helpers";
import Moment from "react-moment";
import { RefData } from "../pages";
import { Call } from "../types/Call.type";

interface QueueProps {
  queueItems: Call[];
  selectJob: (call: Call) => void;
}

const Queue: React.FC<QueueProps> = (props) => {
  const refData = useContext(RefData);
  return (
    <div className="vas-home-table vas-table">
      <div className="vas-home-table-body">
        <div className="vas-table-thead-row"></div>
        {props.queueItems.length &&
          props.queueItems.map((item, idx) => {
            return (
              <div
                key={item._id}
                className={
                  "vas-home-table-tr vas-status-" +
                  item.status +
                  (item.openBy ? " vas-home-table-row-is-open" : "")
                }
                onClick={(e) => {
                  props.selectJob(item);
                }}
              >
                <div className="vas-home-table-time vas-width-10">
                  <Moment format="HH:mm">
                    {helpers.getDateFromObjectId(item._id)}
                  </Moment>
                  <Moment className="vas-home-table-time-date" format="M/D">
                    {helpers.getDateFromObjectId(item._id)}
                  </Moment>
                </div>
                <div className="vas-queue-main-right">
                  <p className="vas-home-table-job-name">
                    {item.job}
                    {item.customJob ? " - " + item.customJob : ""}
                    <b
                      className={
                        "vas-open-status " +
                        (item.openBy ? "vas-open-label-blink" : "")
                      }
                    >
                      {item.openBy ? "OPEN" : ""}
                    </b>
                  </p>
                  <div className="vas-home-table-tr-inner">
                    <span className="vas-queue-table-tr-inner-row">
                      <p>
                        <b>Room:</b>
                        <i className="vas-uppercase">{item.room}</i>
                      </p>
                      <p>
                        <b>Hospital:</b>
                        <i className="vas-capitalize">
                          {refData?.hospitalsById
                            ? //@ts-ignore
                              [item.hospital].name
                            : "N/A"}
                        </i>
                      </p>
                    </span>
                    <span className="vas-queue-table-tr-inner-row">
                      <p>
                        <b>Contact:</b>
                        <i>{item.contact ? item.contact : "N/A"}</i>
                      </p>
                      <p>
                        <b>Nurse:</b>
                        <i className="vas-capitalize">
                          {refData?.usersById
                            ? //@ts-ignore
                              [item.openBy].fullname
                            : "N/A"}
                        </i>
                      </p>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        {props.queueItems.length < 1 && (
          <div>
            <p className="vas-queue-no-items">
              There are no items currently in the queue
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;
