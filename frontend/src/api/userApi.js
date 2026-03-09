import axiosClient from "./axiosClient";

const userApi = {
  login(data) {
    return axiosClient.post("/login", data);
  },

  register(data) {
    return axiosClient.post("/register", data);
  },

  getProfile() {
    return axiosClient.get("/user");
  },

  logout() {
    return axiosClient.post("/logout");
  },
};

export default userApi;
