import { Action, action } from "easy-peasy";

export type ICloudUser = {
  username: string;
  email: string;
  setUsername: Action<ICloudUser, string>;
  setEmail: Action<ICloudUser, string>;
};

export const cloudUser: ICloudUser = {
  username: "",
  email: "",
  setUsername: action((state, newUsername) => {
    state.username = newUsername;
    console.log('set new username', newUsername)
  }),
  setEmail: action((state, newEmail) => {state.email = newEmail}),
}

export async function getUserProfile() {
  console.log("getting user profile");
  let data;

  let res = await api("user-profile", {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem("access_token")}`,
    }
  });

  if (res.ok)
  {
      data = res.json();
      console.log("user profile", data);
      return data;
  }
  else {
      throw new Error("Could not get user profile data");
  }
}

export async function getCurrentUserProjects() {
   console.log("getting current user projects");
   let data;

   let res = await api("user-profile/projects", {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem("access_token")}`,
        }
    });

    if (res.ok)
    {
        data = res.json();
        console.log("user projects", data);
        return data;
    }
    else {
        throw new Error(`Could not get user projects: ${res.status} ${res.statusText}`);
    }
}

export function refreshAccessToken(): boolean {
  try {
      fetch("http://127.0.0.1:8000/api/refresh", {
          method: "POST",
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              refresh_token: sessionStorage.get("refresh_token")
          })
      })
          .then(res => {
              if (res.ok) {
                  return res.json();
              }
              else {
                  throw new Error("Could not refresh access token");
              }
          })
          .then(json => {
              sessionStorage.setItem("access_token", json.access_token);
              sessionStorage.setItem("refresh_token", json.refresh_token);
          })
          .catch(err => {
              console.error(err);
          })
      return true;
  } catch (error) {
      return false;
  }

}

let refreshPromise;

const defaultOptions = { credentials: 'include' };

export const api = async (url, options) => {
    return api_counted(url, 0, options)
}
const api_counted = async (url, retryCount, options) => {
    const res = await fetch(
        new URL(url, "http://localhost:8000/api/"),
        { ...defaultOptions, ...options },
    );
    if (res.ok) {
        console.log("thumbs up", res)
        return res;
    }
    if (res.status === 401) {
        if (!refreshPromise) {
            if (sessionStorage.getItem("refresh_token") !== null) {
                // note there's no `await`, we just set up the hold on the refresh process
                console.log("refresh token expired, refreshing");
                refreshPromise = refreshAccessToken();
            }
           else {
               console.log("no refresh token found");
               return;
            }
        }
        await refreshPromise; // wait for in-progress refresh requests
        refreshPromise = null; // clear the promise once resolved

        // recursively call the request with the same params
        // FIXME: this will cause an infinite loop if any endpoint in
        // the backend consistently returns a 401 in any situation that
        // is unrelated to access tokens
        if (retryCount < 2) {
            return api_counted(url, retryCount + 1, options);
        }
        console.log("refreshing access token failed");
        signOutUser();
        throw new Error(`${res.status} ${res.statusText}`);
    }

    throw new Error(`${res.status} ${res.statusText}`);
};

export function signOutUser() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
}