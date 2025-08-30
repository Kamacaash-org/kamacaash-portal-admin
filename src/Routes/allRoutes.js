import React from "react";
import { Navigate } from "react-router-dom";


// //AuthenticationInner pages
import SignIn from '../pages/AuthenticationInner/Login';
//pages
import UniversityProfile from '../pages/settings/University_Profile/index';
import EditUniProfile from '../pages/settings/University_Profile/EditUniProfile';

import Users from '../pages/settings/Users'

import ProgramCategories from '../pages/Setup/programCategories';
import Schools from '../pages/Setup/Schools'

import Departments from '../pages/Setup/Departments';
import Programs from '../pages/Setup/Programs';
import Staffs from '../pages/Setup/Staffs';




import TwosVerify from '../pages/AuthenticationInner/TwoStepVerification';
import Cover404 from '../pages/AuthenticationInner/Errors/Cover404';
import Alt404 from '../pages/AuthenticationInner/Errors/Alt404';
import Error500 from '../pages/AuthenticationInner/Errors/Error500';

import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";



const authProtectedRoutes = [


  //Pages
  { path: "/setting-profile", component: <UniversityProfile /> },
  { path: "/setting-edit-profile", component: <EditUniProfile /> },

  { path: "/setting-users", component: <Users /> },


  { path: "/setup/parogram-categories", component: <ProgramCategories /> },

  { path: "/setup/schools", component: <Schools /> },

  { path: "/setup/departments", component: <Departments /> },

  { path: "/setup/programs", component: <Programs /> },

  { path: "/setup/staffs", component: <Staffs /> },





  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  { path: "*", component: <Navigate to="/not-found-404" /> },
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