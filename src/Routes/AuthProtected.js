import React, { useEffect } from "react";
import { Navigate, Route, useLocation } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { useDispatch } from "react-redux";

import { useProfile } from "../Components/Hooks/UserHooks";
import useAuthUser from "../Components/Hooks/useAuthUser";
import {
  getDefaultRouteForRole,
  isPathAllowedForRole,
} from "../helpers/permissions";

import { logoutUser } from "../slices/auth/login/thunk";

const AuthProtected = (props) =>{
  const dispatch = useDispatch();
  const location = useLocation();
  const authUser = useAuthUser();
  const { userProfile, loading, token } = useProfile();
  
  useEffect(() => {
    if (userProfile && !loading && token) {
      setAuthorization(token);
    } else if (!userProfile && loading && !token) {
      dispatch(logoutUser());
    }
  }, [token, userProfile, loading, dispatch]);

  /*
    Navigate is un-auth access protected routes via url
    */

  if (!userProfile && loading && !token) {
    return (
      <Navigate to={{ pathname: "/login", state: { from: props.location } }} />
    );
  }

  if (
    authUser?.role &&
    !isPathAllowedForRole(authUser.role, location.pathname)
  ) {
    return <Navigate to={getDefaultRouteForRole(authUser.role)} replace />;
  }

  return <>{props.children}</>;
};

const AccessRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props => {
        return (<> <Component {...props} /> </>);
      }}
    />
  );
};

export { AuthProtected, AccessRoute };
