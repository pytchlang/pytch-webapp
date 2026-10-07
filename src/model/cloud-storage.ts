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
      'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
    }
  });

  if (res?.ok)
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
            'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
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

export function refreshAccessToken() {
        console.log("refresh access token odd", localStorage.getItem("refresh_token"));
        return fetch("http://127.0.0.1:8000/api/refresh", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refresh_token: localStorage.getItem("refresh_token")
            })
        })
            // .then(res => {
            //     if (res.ok) {
            //         return res.json();
            //     } else {
            //         throw new Error("Could not refresh access token");
            //     }
            // })
            // .then(json => {
            //     localStorage.setItem("access_token", json.access_token);
            //     localStorage.setItem("refresh_token", json.refresh_token);
            // })
            // .catch(err => {
            //     console.error(err);
            // })

}

let refreshPromise;

const defaultOptions = { credentials: 'include' };

export const api = async (url, options) => {
    return api_counted(url, 0, options)
}
const api_counted = async (url, retryCount, options) => {
    // TODO: add header with bearer token or edit existing header
    console.log('retries:', retryCount)
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
            if (localStorage.getItem("refresh_token") !== null) {
                // note there's no `await`, we just set up the hold on the refresh process
                console.log("access token expired, refreshing with", localStorage.getItem("refresh_token"));
                refreshPromise = refreshAccessToken();
                console.log("heyo", refreshPromise)
            }
           else {
               console.log("no refresh token found");
               return;
            }
        }
        const res = await refreshPromise; // wait for in-progress refresh requests
        console.log("refreshed", res);
        if (res?.ok) {
            const json = await res.json();
            console.log("adding tokens to storage", json);
            localStorage.setItem("access_token", json.access_token);
            localStorage.setItem("refresh_token", json.refresh_token);
            console.log("new access token in storage", localStorage.getItem("access_token"),
                "\nnew refresh token in storage", localStorage.getItem("refresh_token"));
        }
        refreshPromise = null; // clear the promise once resolved

        // recursively call the request with the same params
        // FIXME: this will cause an infinite loop if any endpoint in
        // the backend consistently returns a 401 in any situation that
        // is unrelated to access tokens
        if (retryCount < 2) {
            console.log('try again')
            let newOptions = options;
            newOptions["headers"]["Authorization"] = `Bearer ${localStorage.getItem("access_token")}`
            console.log("new options", newOptions);
            return await api_counted(url, retryCount + 1, newOptions);
        }
        console.log("refreshing access token failed");
        signOutUser();
        throw new Error(`${res.status} ${res.statusText}`);
    }

    throw new Error(`${res.status} ${res.statusText}`);
};

export function signOutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

export function parseRole(role: string) {
    switch(role.toLowerCase()) {
        case "educator":
            return 1;
        case "user":
            return 2;
        case "student":
            return 3;
    }
}

export function intToRole(role: number) {
    switch(role) {
        case 1:
            return "educator";
        case 2:
            return "user";
        case 3:
            return "student";
    }
}