import { clearUser } from "../../utils/authStorage";

import { logout } from "./authSlice";

import { store } from "../../app/store";

export const logoutUser = () => {
  clearUser();

  store.dispatch(logout());
};