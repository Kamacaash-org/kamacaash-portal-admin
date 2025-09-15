import React from "react";
import { Navigate } from "react-router-dom";


// //AuthenticationInner pages
import SignIn from '../pages/AuthenticationInner/Login';
//pages
import Categories from '../pages/Business_Management/Categories';
import Business from '../pages/Business_Management/Businesses';

import Staff from '../pages/User_Management/Staffs';
import Packages from '../pages/Content_Management/SurplusPackages'


import TwosVerify from '../pages/AuthenticationInner/TwoStepVerification';
import Cover404 from '../pages/AuthenticationInner/Errors/Cover404';
import Alt404 from '../pages/AuthenticationInner/Errors/Alt404';
import Error500 from '../pages/AuthenticationInner/Errors/Error500';

import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";



const authProtectedRoutes = [


  //Pages

  { path: "/business-management/categories", component: <Categories /> },
  { path: "/buiness-management/businsesses", component: <Business /> },
  { path: "/user-management/staff-accounts", component: <Staff /> },
  { path: "/content-management/packages", component: <Packages /> },







  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    // do not forget to change for this
    component: <Navigate to="/dashboard" />,
  },
  // { path: "*", component: <Navigate to="/not-found-404" /> },
];

const publicRoutes = [
  // Authentication Page
  { path: "/login", component: <SignIn /> },

  //AuthenticationInner pages
  { path: "/auth-twostep", component: <TwosVerify /> },
  { path: "/not-found-404", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },

  { path: "/auth-offline", component: <Offlinepage /> },

];

export { authProtectedRoutes, publicRoutes };