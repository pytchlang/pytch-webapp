import { Action, action } from "easy-peasy";
import {envVarOrFail} from "../env-utils";
import {marked} from "marked";
import options = marked.options;

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
        data = await res.json();
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
        data = await res.json();
        console.log("user projects", data);
        return data;
    }
    else {
        throw new Error(`Could not get user projects: ${res.status} ${res.statusText}`);
    }
}

export function refreshAccessToken(verified) {
    console.log("refresh access token", localStorage.getItem(verified ? "refresh_token" : "unverified_user_refresh_token"));
    return fetch(`${envVarOrFail("BACKEND_URL")}/api/refresh`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            refresh_token: localStorage.getItem(verified ? "refresh_token" : "unverified_user_refresh_token")
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let refreshPromise;

const defaultOptions = {
    credentials: 'include',
};

export const api_unverified = async (url, options) => {
    return api_counted(url, 0, false, options)
}

export const api = async (url, options) => {
    return api_counted(url, 0, true, options)
}
const api_counted = async (url, retryCount, verified, options) => {
    // TODO: add header with bearer token or edit existing header
    if (retryCount < 2) {
        console.log('retries:', retryCount)
        console.log("fetching with", options)
        console.log("headers", options.headers ? options.headers : options.header)

        const res = await fetch(
            new URL(url, `${envVarOrFail("BACKEND_URL")}/api/`),
            {
                ...defaultOptions,
                ...options,
                headers: {
                    ...(options.headers ? options.headers : options.header),
                    'Authorization': `Bearer ${localStorage.getItem(verified ? "access_token" : "unverified_user_access_token")}`,
                }
            }
        );
        console.log("response:", res);
        if (res.ok) {
            console.log("thumbs up", res)
            return res;
        }
        if (res.status === 401) {
            if (!refreshPromise) {
                if (verified && localStorage.getItem("refresh_token") !== null) {
                    // note there's no `await`, we just set up the hold on the refresh process
                    console.log("access token expired, refreshing with", localStorage.getItem("refresh_token"));
                    refreshPromise = refreshAccessToken(verified);
                }
                else if (!verified && localStorage.getItem("unverified_user_refresh_token") !== null) {
                    console.log("access token expired, refreshing with", localStorage.getItem("unverified_user_refresh_token"));
                    refreshPromise = refreshAccessToken(verified);
                }
                else {
                    console.log("no refresh token found");
                    return;
                }
            }
            const refresh_res = await refreshPromise; // wait for in-progress refresh requests
            console.log("refreshed", refresh_res);
            if (refresh_res?.ok) {
                const json = await refresh_res.clone().json(); // FIXME: figure out why clone() is needed
                console.log("adding tokens to storage", json);

                if (verified) {
                    localStorage.setItem("access_token", json.access_token);
                    localStorage.setItem("refresh_token", json.refresh_token);
                    console.log("new access token in storage", localStorage.getItem("access_token"));
                    console.log("new refresh token in storage", localStorage.getItem("refresh_token"));
                }
                else {
                    localStorage.setItem("unverified_user_access_token", json.access_token)
                    localStorage.setItem("unverified_user_refresh_token", json.refresh_token)
                    console.log("new unverified access token in storage", localStorage.getItem("unverified_user_access_token"));
                    console.log("new unverified refresh token in storage", localStorage.getItem("unverified_user_refresh_token"));
                }

                console.log("verified:", verified);

            }
            refreshPromise = null; // clear the promise once resolved

            // recursively call the request with the same params
            // FIXME: this will cause an infinite loop if any endpoint in
            // the backend consistently returns a 401 in any situation that
            // is unrelated to access tokens
            console.log('try again with', localStorage.getItem(verified ? "access_token" : "unverified_user_access_token"))
            return await api_counted(url, retryCount + 1, verified, options);
        }

        throw new Error(`${res.status} ${res.statusText}`);
    }
    console.log("refreshing access token failed");
    signOutUser();
    throw new Error(`Refreshing access token failed after ${retryCount} attempts`);
};

export function signOutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

export function parseRole(role: string) {
    switch(role.toLowerCase()) {
        case "admin":
            return 0;
        case "educator":
            return 1;
        case "user":
            return 2;
        case "student":
            return 3;
    }
}

export enum UserRole {
    ADMIN = 0,
    EDUCATOR = 1,
    USER = 2,
    STUDENT = 3
}