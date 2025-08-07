// AuthProvider.jsx
import { useState, useContext, createContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleLogout, GoogleOAuthProvider } from "@react-oauth/google";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("google_id_token") || ""
  );
  const navigate = useNavigate();

  const GOOGLE_CLIENT_ID =
    "698776861878-c80n5ea34srsno3e166ktadc1clfk2v5.apps.googleusercontent.com";

  /*
    Expects an access token provided by local storage or successful google login
    to retrieve the user information from google using the access token and return it
   */
  const getUserInfo = async (accessToken) => {
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    if (!userInfoResponse.ok)
      throw new Error(
        `Failed to fetch user info: ${userInfoResponse.statusText}`
      );

    const decodedUserInfo = await userInfoResponse.json();
    return {
      name: decodedUserInfo.name,
      email: decodedUserInfo.email,
      picture: decodedUserInfo.picture,
      provider: "Google",
      accessToken: accessToken,
    };
  };

  // This is the callback function that gets triggered on a successful Google login.
  // It now expects a TokenResponse (with access_token) from useGoogleLogin.
  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      const accessToken = tokenResponse.access_token;
      if (!accessToken) {
        console.error("Access token not found in Google response.");
        return;
      }

      // For frontend-only, we'll store the access token as a proxy for "logged in" state.
      // In a real app, you'd verify the ID token on a backend and get your own session token.
      const newUser = await getUserInfo(accessToken);
      setUser(newUser);
      setToken(accessToken);
      localStorage.setItem("google_access_token", accessToken);
    } catch (error) {
      console.error("Error processing Google credential:", error);
      setUser(null);
      setToken("");
      localStorage.removeItem("google_access_token");
    }
  };

  // This is the callback for when a Google login fails.
  const handleGoogleError = (errorResponse) => {
    console.error("Google Login Failed:", errorResponse);
  };

  // Attempt to restore the user session from localStorage on component mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem("google_access_token");
    if (storedAccessToken && !user) {
      // Attempt to re-fetch user info using the stored access token
      const fetchStoredUserInfo = async () => {
        try {
          const newUser = await getUserInfo(storedAccessToken);
          setUser(newUser);
          setToken(storedAccessToken);
        } catch (error) {
          console.error(
            "Error restoring user from stored Google token:",
            error
          );
          localStorage.removeItem("google_access_token");
          setUser(null);
          setToken("");
        }
      };
      fetchStoredUserInfo();
    }
  }, [user]); // Depend on 'user' to avoid re-running if user is already set

  const logOut = () => {
    // Clear the user session from state and localStorage
    googleLogout(); // This function from @react-oauth/google helps clear Google's session
    setUser(null);
    setToken("");
    localStorage.removeItem("google_access_token"); // Clear the stored access token
    navigate("/login"); // Navigate to login page after logout
  };

  const authValue = {
    token, // This now holds the access_token for the session
    user,
    handleGoogleSuccess,
    handleGoogleError,
    logOut,
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default AuthProvider;

// Custom hook to easily access the authentication context
export const useAuth = () => {
  return useContext(AuthContext);
};
