//Include Both Helper File with needed methods
// import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { login } from "../../../helpers/backend_helper";
import { setAuthorization } from "../../../helpers/api_helper";
import { getDefaultRouteForRole } from "../../../helpers/permissions";

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
      const tokenBag = data?.tokens || {};
      const accessToken =
        data?.accessToken ||
        data?.access_token ||
        tokenBag?.accessToken ||
        tokenBag?.access_token ||
        tokenBag?.token ||
        null;
      const refreshToken =
        data?.refreshToken ||
        data?.refresh_token ||
        tokenBag?.refreshToken ||
        tokenBag?.refresh_token ||
        null;

      const normalizedData = {
        ...data,
        accessToken: accessToken || data?.accessToken,
        access_token: accessToken || data?.access_token,
        refreshToken: refreshToken || data?.refreshToken,
        refresh_token: refreshToken || data?.refresh_token,
      };

      const resolvedStaffId =
        data?.staffId ||
        data?.staff?.staffId ||
        data?.staff?._id ||
        data?.staff?.id ||
        data?.user?.staffId ||
        data?.user?._id ||
        data?.user?.id ||
        null;

      normalizedData.staffId = resolvedStaffId || normalizedData.staffId;

      if (normalizedResponse.success) {
        const requires2fa = Boolean(data?.requires2fa);

        if (requires2fa) {
          const pending2faSession = {
            ...normalizedResponse,
            data: {
              requires2fa: true,
              staffId: resolvedStaffId,
            },
          };

          sessionStorage.setItem("authUser", JSON.stringify(pending2faSession));
          dispatch(loginSuccess(pending2faSession.data));
          history("/auth-twostep");
          return;
        }

        const normalizedAuthResponse = {
          ...normalizedResponse,
          data: normalizedData,
        };

        sessionStorage.setItem(
          "authUser",
          JSON.stringify(normalizedAuthResponse),
        );

        if (accessToken) {
          setAuthorization(accessToken);
        }

        dispatch(loginSuccess(normalizedData));
        if (normalizedData?.user?.must_change_password) {
          history("/auth-change-password");
        } else {
          history(getDefaultRouteForRole(normalizedData?.user?.role));
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
