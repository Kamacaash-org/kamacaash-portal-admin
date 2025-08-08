//Include Both Helper File with needed methods
// import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postLogin
} from "../../../helpers/backend_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';

export const loginUser = (user, history) => async (dispatch) => {
  try {
    let response;
    response = postLogin({
      username: user.username,
      password: user.password,
    });
    var data = await response;

    if (data) {
      sessionStorage.setItem("authUser", JSON.stringify(data));

      var finallogin = JSON.stringify(data);
      finallogin = JSON.parse(finallogin)
      data = finallogin.data;
      // console.log("ddd", data.status)
      if (data.status === "success") {
        // console.log("ddddddddddd",)
        dispatch(loginSuccess(data));
        history('/auth-twostep-cover')
      } else {
        dispatch(apiError(finallogin));
      }
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");
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