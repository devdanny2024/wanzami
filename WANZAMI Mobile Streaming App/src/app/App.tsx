import { useState } from "react";
import { BottomNavigation, TabName } from "./components/BottomNavigation";
import { SplashScreen } from "./components/SplashScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MoviesScreen } from "./screens/MoviesScreen";
import { SeriesScreen } from "./screens/SeriesScreen";
import { LiveScreen } from "./screens/LiveScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MovieDetailScreen } from "./screens/MovieDetailScreen";
import { LiveStreamPlayerScreen } from "./screens/LiveStreamPlayerScreen";

type AppState = "splash" | "login" | "register" | "app";

type Screen = 
  | { type: "home" }
  | { type: "movies" }
  | { type: "series" }
  | { type: "live" }
  | { type: "profile" }
  | { type: "search" }
  | { type: "movieDetail"; movieId: string }
  | { type: "liveStreamPlayer"; streamId: string };

export default function App() {
  const [appState, setAppState] = useState<AppState>("splash");
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: "home" });

  const handleSplashComplete = () => {
    setAppState("login");
  };

  const handleLogin = () => {
    setAppState("app");
  };

  const handleRegister = () => {
    setAppState("app");
  };

  const handleNavigateToRegister = () => {
    setAppState("register");
  };

  const handleNavigateToLogin = () => {
    setAppState("login");
  };

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    setCurrentScreen({ type: tab });
  };

  const handleSearchClick = () => {
    setCurrentScreen({ type: "search" });
  };

  const handleMovieClick = (id: string) => {
    setCurrentScreen({ type: "movieDetail", movieId: id });
  };

  const handleLiveStreamClick = (id: string) => {
    setCurrentScreen({ type: "liveStreamPlayer", streamId: id });
  };

  const handleBack = () => {
    // Go back to the active tab's screen
    setCurrentScreen({ type: activeTab });
  };

  const showBottomNav = currentScreen.type !== "search" && 
                        currentScreen.type !== "movieDetail" && 
                        currentScreen.type !== "liveStreamPlayer";

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white max-w-md mx-auto relative">
      {/* Render current screen */}
      {appState === "splash" && <SplashScreen onComplete={handleSplashComplete} />}
      {appState === "login" && <LoginScreen onLogin={handleLogin} onNavigateToRegister={handleNavigateToRegister} />}
      {appState === "register" && <RegisterScreen onRegister={handleRegister} onNavigateToLogin={handleNavigateToLogin} />}
      {appState === "app" && (
        <>
          {currentScreen.type === "home" && (
            <HomeScreen 
              onSearchClick={handleSearchClick}
              onMovieClick={handleMovieClick}
              onLiveStreamClick={handleLiveStreamClick}
            />
          )}
          
          {currentScreen.type === "movies" && (
            <MoviesScreen 
              onSearchClick={handleSearchClick}
              onMovieClick={handleMovieClick}
            />
          )}
          
          {currentScreen.type === "series" && (
            <SeriesScreen 
              onSearchClick={handleSearchClick}
              onSeriesClick={handleMovieClick}
            />
          )}
          
          {currentScreen.type === "live" && (
            <LiveScreen 
              onSearchClick={handleSearchClick}
              onLiveStreamClick={handleLiveStreamClick}
            />
          )}
          
          {currentScreen.type === "profile" && (
            <ProfileScreen onBack={handleBack} />
          )}
          
          {currentScreen.type === "search" && (
            <SearchScreen 
              onBack={handleBack}
              onMovieClick={handleMovieClick}
            />
          )}
          
          {currentScreen.type === "movieDetail" && (
            <MovieDetailScreen 
              movieId={currentScreen.movieId}
              onBack={handleBack}
              onMovieClick={handleMovieClick}
            />
          )}
          
          {currentScreen.type === "liveStreamPlayer" && (
            <LiveStreamPlayerScreen 
              streamId={currentScreen.streamId}
              onBack={handleBack}
            />
          )}
          
          {/* Bottom Navigation */}
          {showBottomNav && (
            <BottomNavigation 
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
          
          {/* Add global scrollbar styles */}
          <style dangerouslySetInnerHTML={{ __html: `
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            
            /* Custom scrollbar for chat */
            ::-webkit-scrollbar {
              width: 6px;
            }
            ::-webkit-scrollbar-track {
              background: #14141B;
            }
            ::-webkit-scrollbar-thumb {
              background: #1C1C25;
              border-radius: 3px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #FF6A00;
            }
          ` }} />
        </>
      )}
    </div>
  );
}