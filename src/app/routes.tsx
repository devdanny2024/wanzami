import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Movies } from "./pages/Movies";
import { Series } from "./pages/Series";
import { Live } from "./pages/Live";
import { LivePlayer } from "./pages/LivePlayer";
import { VideoPlayer } from "./pages/VideoPlayer";
import { Search } from "./pages/Search";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { AuthScreen } from "./pages/AuthScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "movies", Component: Movies },
      { path: "series", Component: Series },
      { path: "live", Component: Live },
      { path: "live/:eventId", Component: LivePlayer },
      { path: "watch/:contentId", Component: VideoPlayer },
      { path: "search", Component: Search },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/auth",
    Component: AuthScreen,
  },
]);