//Include Both Helper File with needed methods
// import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { login } from "../../../helpers/backend_helper";
import { setAuthorization } from "../../../helpers/api_helper";

import {
  loginStart,
  loginSuccess,
  logoutUserSuccess,
  apiError,
  reset_login_flag,
} from "./reducer";

export const loginUser = (user, history) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const response = login({
      username: user.username,
      password: user.password,
    });
    const loginResponse = await response;

    if (loginResponse) {
      const normalizedResponse = JSON.parse(JSON.stringify(loginResponse));
      const data = normalizedResponse?.data || {};

      if (normalizedResponse.success) {
        const requires2fa = Boolean(data?.requires2fa);

        if (requires2fa) {
          const pending2faSession = {
            ...normalizedResponse,
            data: {
              requires2fa: true,
              staffId: data?.staffId,
            },
          };

          sessionStorage.setItem("authUser", JSON.stringify(pending2faSession));
          dispatch(loginSuccess(pending2faSession.data));
          history("/auth-twostep");
          return;
        }

        sessionStorage.setItem("authUser", JSON.stringify(normalizedResponse));

        const accessToken = data?.accessToken || data?.access_token;
        if (accessToken) {
          setAuthorization(accessToken);
        }

        dispatch(loginSuccess(data));
        if (data?.user?.must_change_password) {
          history("/auth-change-password");
        } else {
          history("/dashboard");
        }
      } else {
        dispatch(apiError(normalizedResponse));
      }
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");
    localStorage.removeItem("user");
    setAuthorization(null);
    dispatch(logoutUserSuccess(true));
    // let fireBaseBackend = getFirebaseBackend();
    // if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
    //   const response = fireBaseBackend.logout;
    //   dispatch(logoutUserSuccess(response));
    // } else {
    //   dispatch(logoutUserSuccess(true));
    // }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};
