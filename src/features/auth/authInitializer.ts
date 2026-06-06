import { store } from "../../app/store";
import { loginSuccess } from "./authSlice";

import { getUser } from "../../utils/authStorage";

export const initializeAuth = () => {
  const user = getUser();

  if (user) {
    store.dispatch(
      loginSuccess(user)
    );
  }
};