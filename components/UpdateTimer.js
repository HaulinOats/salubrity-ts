import React, { Component } from "react";

export default class UpdateTimer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lastUpdate: 0,
    };
    this.timerTick = this.timerTick.bind(this);
  }

  componentDidMount() {
    this.setState({ lastUpdate: 0 }, () => {
      this.updateTimer = setInterval(this.timerTick, 1000);
    });
  }

  timerTick() {
    this.setState({ lastUpdate: this.state.lastUpdate + 1 });
  }

  componentWillUnmount() {
    clearInterval(this.updateTimer);
  }

  render() {
    return (
      <div className="vas-last-update-container">
        <p className="vas-last-update-label">Last Update:</p>
        <p className="vas-last-update-timer">
          {Math.floor(this.state.lastUpdate / 60) > 0
            ? Math.floor(this.state.lastUpdate / 60)
            : "0"}
          :
          {this.state.lastUpdate - Math.floor(this.state.lastUpdate / 60) * 60 <
          10
            ? "0" +
              (this.state.lastUpdate -
                Math.floor(this.state.lastUpdate / 60) * 60)
            : this.state.lastUpdate -
              Math.floor(this.state.lastUpdate / 60) * 60}
        </p>
      </div>
    );
  }
}
