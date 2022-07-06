import React, { Component } from "react";

export default class DressingChange extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // this.setState({
    //   currentRecord:nextProps.activeRecord,
    // })
  }

  render() {
    return <div className="vas-dressing-change"></div>;
  }
}
