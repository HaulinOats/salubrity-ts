import "../styles/globals.css";
import type { AppProps } from "next/app";
import "../styles/AddCall.css";
import "../styles/Admin.css";
import "../styles/DressingChange.css";
import "../styles/EditProcedure.css";
import "../styles/Filters.css";
import "../styles/Home.css";
import "../styles/LineProcedures.css";
import "../styles/Login.css";
import "../styles/Modal.css";
import "../styles/Queue.css";
import "../styles/ReturnedProcedures.css";
import "../styles/UpdateTimer.css";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
