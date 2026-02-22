import { combineReducers } from "redux";

// Front
import LayoutReducer from "./layouts/reducer";

// Authentication
import LoginReducer from "./auth/login/reducer";
import AccountReducer from "./auth/register/reducer";
import ForgetPasswordReducer from "./auth/forgetpwd/reducer";
import ProfileReducer from "./auth/profile/reducer";

import BusinessManagementReducer from "./Business_Management/reducer";
import UserManagementReducer from "./User_Management/reducer";
import ContentManagementReducer from "./Content_Management/reducer";
import OrderReducer from "./Orders/reducer";
import SettingsReducer from "./Settings/reducer";
const rootReducer = combineReducers({
  Layout: LayoutReducer,
  Login: LoginReducer,
  Account: AccountReducer,
  ForgetPassword: ForgetPasswordReducer,
  Profile: ProfileReducer,
  BusinessManagement: BusinessManagementReducer,
  UserManagement: UserManagementReducer,
  ContentManagement: ContentManagementReducer,
  Orders: OrderReducer,
  Settings: SettingsReducer,
});

export default rootReducer;
