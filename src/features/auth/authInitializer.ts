import { onAuthStateChanged, signOut } from "firebase/auth";

import { store } from "../../app/store";
import { auth } from "../../firebase/firebaseConfig";
import { loginSuccess, logout } from "./authSlice";
import { buildAuthUser, fetchProfile } from "./authService";

/**
 * Replaces the old localStorage session (utils/authStorage):
 *  - Firebase Auth persists the session itself (IndexedDB), and
 *  - every auth-state change re-derives the Redux store from users/{uid}.
 *
 * firestore.rules authorize from that same document, so a tampered UI
 * session can no longer grant access the server would reject.
 */
export const initializeAuth = () => {
  onAuthStateChanged(
    auth,
    async (firebaseUser) => {
      if (!firebaseUser) {
        store.dispatch(logout());
        return;
      }

      try {
        const profile = await fetchProfile(
          firebaseUser.uid
        );

        if (!profile || profile.isActive !== true) {
          store.dispatch(logout());
          // No role document / deactivated → end the Firebase session too.
          await signOut(auth);
          return;
        }

        store.dispatch(
          loginSuccess(
            buildAuthUser(
              firebaseUser.uid,
              firebaseUser.email ?? "",
              profile
            )
          )
        );
      } catch (error) {
        // Profile unreadable (offline, or rules rejected the self-read):
        // fail closed rather than showing an unbacked session.
        console.warn(
          "Could not load user profile, signing out.",
          error
        );
        store.dispatch(logout());
      }
    }
  );
};