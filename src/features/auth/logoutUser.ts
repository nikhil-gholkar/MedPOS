import { logout } from "./authSlice";

import { store } from "../../app/store";
import { signOutSession } from "./authService";

export const logoutUser = async () => {
  await signOutSession();

  store.dispatch(logout());
};