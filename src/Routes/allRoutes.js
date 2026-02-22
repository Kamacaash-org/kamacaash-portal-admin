import React from "react";
import { Navigate } from "react-router-dom";

// //AuthenticationInner pages
import SignIn from "../pages/AuthenticationInner/Login";
import Dashboard from "../pages/Dashboard";
//pages
import Categories from "../pages/Business_Management/Categories";
import Business from "../pages/Business_Management/Businesses";
import BusinessProfileSettings from "../pages/Business_Management/BusinessProfileSettings";
import BusinessReviews from "../pages/Business_Management/BusinessReviews";
import ReviewRequests from "../pages/Business_Management/ReviewRequests";

import Staff from "../pages/User_Management/Staffs";
import StaffProfile from "../pages/User_Management/StaffProfile";
import Packages from "../pages/Content_Management/SurplusPackages";
import UploadContract from "../pages/Business_Management/UploadContract";
import ApproveBusiness from "../pages/Business_Management/ApproveBusiness";
import Country from "../pages/Settings/Country";

import PendingOrders from "../pages/Orders/Orders/index";
import CompletedRejectedOrders from "../pages/Orders/Orders/CompletedRejectedOrders";

import TwosVerify from "../pages/AuthenticationInner/TwoStepVerification";
import ChangePassword from "../pages/AuthenticationInner/ChangePassword";
import Cover404 from "../pages/AuthenticationInner/Errors/Cover404";
import Alt404 from "../pages/AuthenticationInner/Errors/Alt404";
import Error500 from "../pages/AuthenticationInner/Errors/Error500";

import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";

const authProtectedRoutes = [
  // Dashboard
  { path: "/dashboard", component: <Dashboard /> },

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

  // Content
  { path: "/content/packages", component: <Packages /> },

  // Settings
  { path: "/settings/country", component: <Country /> },

  // Default
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  // { path: "*", component: <Navigate to="/not-found-404" /> },
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
