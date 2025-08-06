// AuthProvider.jsx
import { useState, useContext, createContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleLogout, GoogleOAuthProvider } from "@react-oauth/google";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("google_id_token") || "" // Still storing the ID token if available
  );
  const navigate = useNavigate();

  // --- Google Client ID ---
  const GOOGLE_CLIENT_ID =
    "698776861878-c80n5ea34srsno3e166ktadc1clfk2v5.apps.googleusercontent.com";

  // This is the callback function that gets triggered on a successful Google login.
  // It now expects a TokenResponse (with access_token) from useGoogleLogin.
  const handleGoogleSuccess = async (tokenResponse) => {
    // Made async
    try {
      // The tokenResponse from useGoogleLogin (implicit flow) provides an access_token.
      // We need to use this access_token to fetch the user's profile information.
      const accessToken = tokenResponse.access_token;

      if (!accessToken) {
        console.error("Access token not found in Google response.");
        return;
      }

      // Fetch user info using the access token
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error(
          `Failed to fetch user info: ${userInfoResponse.statusText}`
        );
      }

      const decodedUserInfo = await userInfoResponse.json();

      // The decodedUserInfo now contains the profile data (name, email, picture)
      const newUser = {
        name: decodedUserInfo.name,
        email: decodedUserInfo.email,
        picture: decodedUserInfo.picture,
        provider: "Google",
        // Store the original access token if you need it for further API calls
        accessToken: accessToken,
        // The ID token is not directly returned by useGoogleLogin implicit flow,
        // so we won't store it from this response. If you strictly need an ID token
        // for backend validation, you'd need the auth-code flow.
      };

      // Set the user state and store the access token (or a flag) in localStorage
      // For frontend-only, we'll store the access token as a proxy for "logged in" state.
      // In a real app, you'd verify the ID token on a backend and get your own session token.
      setUser(newUser);
      setToken(accessToken); // Storing the access_token as the "token" for session.
      localStorage.setItem("google_access_token", accessToken); // Use a new key for clarity

      navigate("/"); // Navigate to the dashboard or home page
    } catch (error) {
      console.error("Error processing Google credential:", error);
      // Optionally clear any partial login state
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
      // This is a simplified re-auth for frontend-only.
      // In production, you'd likely have a refresh token or backend session.
      const fetchStoredUserInfo = async () => {
        try {
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${storedAccessToken}`,
            {
              headers: {
                Authorization: `Bearer ${storedAccessToken}`,
                Accept: "application/json",
              },
            }
          );

          if (!userInfoResponse.ok) {
            throw new Error("Failed to refresh user info with stored token.");
          }

          const decodedUserInfo = await userInfoResponse.json();
          setUser({
            name: decodedUserInfo.name,
            email: decodedUserInfo.email,
            picture: decodedUserInfo.picture,
            provider: "Google",
            accessToken: storedAccessToken,
          });
          setToken(storedAccessToken);
        } catch (error) {
          console.error(
            "Error restoring user from stored Google token:",
            error
          );
          localStorage.removeItem("google_access_token"); // Clear invalid token
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
