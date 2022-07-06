import React, { useEffect, useState } from "react";

const UpdateTimer: React.FC = () => {
  const [intervalSeconds, setIntervalSeconds] = useState(0);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      setIntervalSeconds((intervalSeconds) => intervalSeconds + 1);
    }, 1000);
    return () => clearInterval(updateInterval);
  }, []);

  let formattedSeconds: number = 0;

  if (intervalSeconds / 60 > 0) {
    formattedSeconds = intervalSeconds / 60;
  }

  const getMinutes = () => {
    let minutes = Math.floor(intervalSeconds / 60);
    if (minutes > 0) return minutes;
    return 0;
  };

  const getSeconds = () => {
    let secondsMod = intervalSeconds % 60;
    if (secondsMod < 10) return `0${secondsMod}`;
    return secondsMod;
  };

  return (
    <div className="vas-last-update-container">
      <p className="vas-last-update-label">Last Update:</p>
      <p className="vas-last-update-timer">
        {getMinutes()}:{getSeconds()}
      </p>
    </div>
  );
};

export default UpdateTimer;
