import React, { ChangeEvent, useContext, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { DebounceInput } from "react-debounce-input";
import { RefData } from "../pages";
import moment, { Moment } from "moment";
import { Call } from "../types/Call.type";

interface FiltersProps {
  returnedCalls: (aggObj: { calls: Call[]; aggregation: any }) => void;
  hideUI: () => void;
  toggleHideUI: () => void;
  shouldHideUI: boolean;
}

interface FilterFields {
  [key: number]: any;
  fieldName: string;
  text?: string;
  value?: string | number;
  placeholder?: string;
  options?: {
    value: string | number;
    text: string;
  }[];
}

interface FiltersState {
  startDate: Moment;
  endDate: Moment;
  filterFields: FilterFields[];
  activeFilters: FilterFields[];
}

const Filters: React.FC<FiltersProps> = (props) => {
  const refData = useContext(RefData);
  const [filtersState, setFiltersState] = useState<FiltersState>({
    startDate: moment(),
    endDate: moment(),
    activeFilters: [] as FilterFields[],
    filterFields: [] as FilterFields[],
  });

  useEffect(() => {
    let userOptions = [];
    let users = refData.users;
    users.sort((a, b) => {
      if (a.fullname > b.fullname) return 1;
      if (a.fullname < b.fullname) return -1;
      return 0;
    });
    //Build dropdowns for filters
    for (let i = 0; i < users.length; i++) {
      userOptions.push({
        value: users[i].userId,
        text: users[i].fullname,
      });
    }
    let hospitalOptions: { value: string | number; text: string }[] = [
      { value: "Erlanger", text: "Erlanger (All)" },
    ];
    for (let i = 0; i < refData.hospitals!.options!.length; i++) {
      hospitalOptions.push({
        value: refData.hospitals!.options![i].id,
        text: refData.hospitals!.options![i].name,
      });
    }
    let procedureOptions = [];
    for (let i = 0; i < refData.procedures.length; i++) {
      if (refData.procedures[i].procedureId !== 10) {
        //if PIV (2nd) procedure, don't add to options dropdown
        procedureOptions.push({
          value: refData.procedures[i].procedureId,
          text: refData.procedures[i].name,
        });
      }
    }
    let insertionTypeOptions: { value: string | number; text: string }[] = [];
    refData.items.forEach((item) => {
      if (refData.itemsById![item.itemId].groupName === "Insertion Type") {
        insertionTypeOptions.push({
          value: item.itemId,
          text: refData.itemsById![item.itemId].value as string,
        });
      }
    });
    let orderChangeOptions = [];
    for (let i = 0; i < refData.orderChanges!.options!.length; i++) {
      orderChangeOptions.push({
        value: refData.orderChanges!.options![i].id,
        text: refData.orderChanges!.options![i].name,
      });
    }
    setFiltersState({
      ...filtersState,
      filterFields: [
        { fieldName: "completedBy", text: "Nurse", options: userOptions },
        { fieldName: "hospital", text: "Hospital", options: hospitalOptions },
        { fieldName: "mrn", text: "MRN" },
        {
          fieldName: "patientName",
          text: "Patient Name",
          placeholder: "7 characters minimum",
        },
        { fieldName: "provider", text: "Provider" },
        { fieldName: "room", text: "Room" },
        {
          fieldName: "procedureId",
          text: "Procedure",
          options: procedureOptions,
        },
        {
          fieldName: "insertionType",
          text: "Insertion Type",
          options: insertionTypeOptions,
        },
        {
          fieldName: "orderChange",
          text: "Order Change",
          options: orderChangeOptions,
        },
        { fieldName: "responseTime", text: "Response Time" },
        { fieldName: "procedureTime", text: "Procedure Time" },
        { fieldName: "insertedBy", text: "External Insertion" },
      ].sort((a, b) => {
        if (a.text > b.text) return 1;
        if (a.text < b.text) return -1;
        return 0;
      }),
    });
  }, []);

  useEffect(() => {
    queryRangeDiff();
  }, [filtersState.startDate, filtersState.endDate]);

  const selectFilter = (e: ChangeEvent<HTMLSelectElement>) => {
    let filterFields = filtersState.filterFields;
    let activeFilters = filtersState.activeFilters;
    for (let i = filterFields.length - 1; i >= 0; i--) {
      if (filterFields[i].fieldName === e.target.value) {
        activeFilters.push(filterFields.splice(i, 1)[0]);
        break;
      }
    }
    setFiltersState({
      ...filtersState,
      filterFields,
      activeFilters,
    });
  };

  const childFilterOnChange = (
    e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>,
    filterIdx: number,
    isCustom: boolean
  ) => {
    let activeFilters = filtersState.activeFilters;
    if (e.target.value === "" && !isCustom) {
      deleteFilter(filterIdx);
    } else {
      activeFilters.forEach((_filter, fIdx) => {
        if (fIdx === filterIdx) {
          activeFilters[fIdx].value = e.target.value;
        }
      });
    }
    setFiltersState({ ...filtersState, activeFilters });
  };

  const deleteFilter = (filterIndex: number) => {
    let activeFilters = filtersState.activeFilters;
    let filterFields = filtersState.filterFields;
    filterFields.push(activeFilters.splice(filterIndex, 1)[0]);
    filterFields.sort((a, b) => {
      if (a.text && b.text) {
        if (a.text > b.text) return 1;
        if (a.text < b.text) return -1;
      }
      return 0;
    });
    setFiltersState({
      ...filtersState,
      activeFilters,
      filterFields,
    });
  };

  const submitQuery = () => {
    let queryObject = {
      startDate: moment(filtersState.startDate).startOf("day").toISOString(),
      endDate: moment(filtersState.endDate).endOf("day").toISOString(),
      filtersArr: [] as any,
    };

    filtersState.activeFilters.forEach((filter) => {
      queryObject.filtersArr.push([filter.fieldName, filter.value]);
    });

    axios
      .post("/get-calls-by-query", queryObject)
      .then((resp) => {
        if (!resp.data.calls) {
          alert("no calls returned for that specific query");
        } else {
          props.returnedCalls(resp.data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const startDateChange = (date: Date) => {
    setFiltersState({ ...filtersState, startDate: moment(date) });
  };

  const endDateChange = (date: Date) => {
    setFiltersState({ ...filtersState, endDate: moment(date) });
  };

  const queryRangeDiff = () => {
    let dayRange = Math.abs(
      filtersState.startDate.diff(filtersState.endDate, "days")
    );
    // console.log(dayRange);
    if (dayRange > 45) {
      props.hideUI();
    }
  };

  return (
    <div className="vas-filters">
      <div className="vas-filters-date-range-container">
        <div className="vas-filters-date-range-inner">
          <p className="vas-filters-date-label">From:</p>
          <DatePicker
            className="vas-filters-datepicker"
            selected={filtersState.startDate.toDate()}
            onChange={startDateChange}
          />
        </div>
        <div className="vas-filters-date-range-inner">
          <p className="vas-filters-date-label">To:</p>
          <DatePicker
            className="vas-filters-datepicker"
            selected={filtersState.endDate.toDate()}
            onChange={endDateChange}
          />
        </div>
      </div>
      <div className="vas-filters-filters-container">
        {filtersState.activeFilters.map((filter, idx) => {
          return (
            <div
              key={filter.fieldName + idx}
              className="vas-filters-outer-filter-container"
            >
              <div className="vas-inline-block">
                <div
                  className="vas-filters-delete-filter"
                  onClick={(e) => {
                    deleteFilter(idx);
                  }}
                >
                  <p>&times;</p>
                </div>
              </div>
              <div className="vas-inline-block">
                <div className="vas-filters-filter-container-inner">
                  <p className="vas-filters-filter-title">{filter.text}</p>
                </div>
                <div className="vas-filters-filter-container-inner">
                  {filter.options && (
                    <select
                      className="vas-select vas-filters-child-filter"
                      onChange={(e) => {
                        childFilterOnChange(e, idx, false);
                      }}
                    >
                      <option value="">Select An Option</option>
                      {filter.options &&
                        filter.options.map((option, idx) => {
                          return (
                            <option
                              key={option.text + idx}
                              value={option.value}
                            >
                              {option.text}
                            </option>
                          );
                        })}
                    </select>
                  )}
                  {!filter.options && filter.fieldName && (
                    <span>
                      {filter.fieldName !== "insertedBy" && (
                        <DebounceInput
                          className="vas-input vas-filters-child-filter"
                          minLength={1}
                          debounceTimeout={300}
                          placeholder={filter.placeholder ?? ""}
                          onChange={(e) => {
                            childFilterOnChange(e, idx, true);
                          }}
                        />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="vas-filters-add-filter-container">
        <select
          className="vas-select vas-filters-main-filter-select"
          onChange={selectFilter}
        >
          <option value="">Add Filter</option>
          {filtersState.filterFields.map((filterField) => {
            return (
              <option key={filterField.fieldName} value={filterField.fieldName}>
                {filterField.text}
              </option>
            );
          })}
        </select>
      </div>
      <span>
        <input
          type="checkbox"
          id="hide-ui"
          className="vas-checkbox-select"
          checked={props.shouldHideUI}
        />
        <label
          className="vas-btn vas-filters-hide-ui"
          htmlFor="hide-ui"
          onClick={props.toggleHideUI}
        >
          Hide UI
        </label>
      </span>
      <button className="vas-filters-submit-query" onClick={submitQuery}>
        Submit
      </button>
    </div>
  );
};

export default Filters;
