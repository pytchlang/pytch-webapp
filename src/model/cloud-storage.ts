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

  let res = await fetch("http://127.0.0.1:8000/api/user-profile", {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
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