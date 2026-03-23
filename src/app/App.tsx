import { RouterProvider } from "react-router";
import { router } from "./routes";
import { DeviceProvider } from "./context/DeviceContext";
import { FocusProvider } from "./context/FocusContext";

export default function App() {
  return (
    <DeviceProvider>
      <FocusProvider>
        <div className="dark min-h-screen bg-[#0A0A0F]">
          <RouterProvider router={router} />
        </div>
      </FocusProvider>
    </DeviceProvider>
  );
}
