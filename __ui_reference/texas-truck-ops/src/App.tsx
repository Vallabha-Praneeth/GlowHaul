import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "./pages/auth/Login";
import OTPVerification from "./pages/auth/OTPVerification";

// Operator
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import AddEditTruck from "./pages/operator/AddEditTruck";
import TruckDetail from "./pages/operator/TruckDetail";
import AddEditSlot from "./pages/operator/AddEditSlot";
import OffersList from "./pages/operator/OffersList";
import OfferDetail from "./pages/operator/OfferDetail";

// Broker
import BrokerDashboard from "./pages/broker/BrokerDashboard";
import MarketplaceSearch from "./pages/broker/MarketplaceSearch";
import SlotDetail from "./pages/broker/SlotDetail";
import CreateOffer from "./pages/broker/CreateOffer";

// Driver
import DriverDashboard from "./pages/driver/DriverDashboard";
import RunDetail from "./pages/driver/RunDetail";
import ProofUpload from "./pages/driver/ProofUpload";

// Shared
import BookingDetail from "./pages/shared/BookingDetail";
import Profile from "./pages/shared/Profile";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<Login />} />
          <Route path="/auth/verify" element={<OTPVerification />} />

          {/* Operator */}
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/operator/trucks/new" element={<AddEditTruck />} />
          <Route path="/operator/trucks/:id" element={<TruckDetail />} />
          <Route path="/operator/trucks/:id/edit" element={<AddEditTruck />} />
          <Route path="/operator/slots" element={<OperatorDashboard />} />
          <Route path="/operator/slots/new" element={<AddEditSlot />} />
          <Route path="/operator/slots/:id" element={<AddEditSlot />} />
          <Route path="/operator/offers" element={<OffersList />} />
          <Route path="/operator/offers/:id" element={<OfferDetail />} />
          <Route path="/operator/bookings" element={<OperatorDashboard />} />

          {/* Broker */}
          <Route path="/broker" element={<BrokerDashboard />} />
          <Route path="/broker/search" element={<MarketplaceSearch />} />
          <Route path="/broker/slots/:id" element={<SlotDetail />} />
          <Route path="/broker/slots/:slotId/offer" element={<CreateOffer />} />
          <Route path="/broker/offers" element={<BrokerDashboard />} />
          <Route path="/broker/bookings" element={<BrokerDashboard />} />

          {/* Driver */}
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/runs" element={<DriverDashboard />} />
          <Route path="/driver/runs/:id" element={<RunDetail />} />
          <Route path="/driver/runs/:id/proof" element={<ProofUpload />} />

          {/* Shared */}
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/profile" element={<Profile />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
