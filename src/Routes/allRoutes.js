import React from "react";
import { Navigate } from "react-router-dom";

// //AuthenticationInner pages
import SignIn from "../pages/AuthenticationInner/Login";
import Dashboard from "../pages/Dashboard";
import DailyLedger from "../pages/Reports/DailyLedger";
import WeeklyRollup from "../pages/Reports/WeeklyRollup";
import MonthlyStatement from "../pages/Reports/MonthlyStatement";
import OfferPerformance from "../pages/Reports/OfferPerformance";
import AdminDailyCommission from "../pages/Reports/AdminDailyCommission";
import AdminWeeklyCommission from "../pages/Reports/AdminWeeklyCommission";
import AdminMonthlyCommission from "../pages/Reports/AdminMonthlyCommission";
import TopProviders from "../pages/Reports/TopProviders";
import TopCategories from "../pages/Reports/TopCategories";
import TopSavers from "../pages/Reports/TopSavers";
import MostFavorited from "../pages/Reports/MostFavorited";
import UserGrowthCohort from "../pages/Reports/UserGrowthCohort";
//pages
import Categories from "../pages/Business_Management/Categories";
import Business from "../pages/Business_Management/Businesses";
import BusinessProfileSettings from "../pages/Business_Management/BusinessProfileSettings";
import BusinessReviews from "../pages/Business_Management/BusinessReviews";
import ReviewRequests from "../pages/Business_Management/ReviewRequests";

import Staff from "../pages/User_Management/Staffs";
import StaffProfile from "../pages/User_Management/StaffProfile";
import Offers from "../pages/Content_Management/SurplusPackages";
import UploadContract from "../pages/Business_Management/UploadContract";
import ApproveBusiness from "../pages/Business_Management/ApproveBusiness";
import Country from "../pages/Settings/Country";
import Cities from "../pages/Settings/Cities";

import PendingOrders from "../pages/Orders/Orders/index";
import CompletedRejectedOrders from "../pages/Orders/Orders/CompletedRejectedOrders";
import PaymentDiagnostics from "../pages/Payments/PaymentDiagnostics";

import TwosVerify from "../pages/AuthenticationInner/TwoStepVerification";
import ChangePassword from "../pages/AuthenticationInner/ChangePassword";
import Cover404 from "../pages/AuthenticationInner/Errors/Cover404";
import Alt404 from "../pages/AuthenticationInner/Errors/Alt404";
import Error500 from "../pages/AuthenticationInner/Errors/Error500";

import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";
import useAuthUser from "../Components/Hooks/useAuthUser";
import { getDefaultRouteForRole } from "../helpers/permissions";

const RootRedirect = () => {
  const authUser = useAuthUser();
  return <Navigate to={getDefaultRouteForRole(authUser?.role)} />;
};

const authProtectedRoutes = [
  // Dashboard
  { path: "/dashboard", component: <Dashboard /> },
  
  // Reports
  { path: "/reports/daily", component: <DailyLedger /> },
  { path: "/reports/weekly", component: <WeeklyRollup /> },
  { path: "/reports/monthly", component: <MonthlyStatement /> },
  { path: "/reports/performance", component: <OfferPerformance /> },
  { path: "/reports/admin/commission-daily", component: <AdminDailyCommission /> },
  { path: "/reports/admin/commission-weekly", component: <AdminWeeklyCommission /> },
  { path: "/reports/admin/commission-monthly", component: <AdminMonthlyCommission /> },
  { path: "/reports/admin/providers", component: <TopProviders /> },
  { path: "/reports/admin/categories", component: <TopCategories /> },
  { path: "/reports/admin/savers", component: <TopSavers /> },
  { path: "/reports/admin/favorites", component: <MostFavorited /> },
  { path: "/reports/admin/user-growth", component: <UserGrowthCohort /> },

  // Business
  { path: "/business/categories", component: <Categories /> },
  { path: "/business/list", component: <Business /> },
  {
    path: "/business/profile-settings",
    component: <BusinessProfileSettings />,
  },

  // Reviews (separated)
  { path: "/reviews", component: <BusinessReviews /> },
  { path: "/reviews/feature-requests", component: <ReviewRequests /> },

  // Contracts + Approval
  { path: "/business/contracts", component: <UploadContract /> },
  { path: "/business/approval", component: <ApproveBusiness /> },

  // Orders
  { path: "/orders", component: <PendingOrders /> }, // manage orders
  { path: "/orders/history", component: <CompletedRejectedOrders /> },

  // Users
  { path: "/users/staff", component: <Staff /> },
  { path: "/users/staff-profile", component: <StaffProfile /> },

  // Offers
  { path: "/offers", component: <Offers /> },

  // Settings
  { path: "/settings/country", component: <Country /> },
  { path: "/settings/cities", component: <Cities /> },

  // Payments
  { path: "/payments/diagnostics", component: <PaymentDiagnostics /> },

  // Default
  {
    path: "/",
    exact: true,
    component: <RootRedirect />,
  },
];

const publicRoutes = [
  // Authentication Page
  { path: "/login", component: <SignIn /> },

  //AuthenticationInner pages
  { path: "/auth-twostep", component: <TwosVerify /> },
  { path: "/auth-change-password", component: <ChangePassword /> },
  { path: "/not-found-404", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },

  { path: "/auth-offline", component: <Offlinepage /> },
];

export { authProtectedRoutes, publicRoutes };
