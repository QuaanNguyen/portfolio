import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { PLAYGROUND_MAINTENANCE } from "./playgroundMaintenance";

const SandboxPage = lazy(() => import("./sandbox/SandboxPage"));

export default function PlaygroundRoute() {
  if (PLAYGROUND_MAINTENANCE) return <Navigate to="/" replace />;
  return <SandboxPage />;
}
