import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/Overview";
import VehicleDetection from "./pages/VehicleDetection";
import SignalController from "./pages/SignalController";
import RouteFinder from "./pages/RouteFinder";
import WeatherAlerts from "./pages/WeatherAlerts";

import TrafficQuiz from "./pages/TrafficQuiz";
import NotFound from "./pages/NotFound";
import LanguageSwitcher from "./components/LanguageSwitcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
       <div className="fixed top-3 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/detection" element={<VehicleDetection />} />
            <Route path="/signals" element={<SignalController />} />
            <Route path="/routes" element={<RouteFinder />} />
            <Route path="/weather" element={<WeatherAlerts />} />
            
            <Route path="/quiz" element={<TrafficQuiz />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
