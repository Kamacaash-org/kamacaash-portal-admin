// // src/slices/settings/thunk.js
// import { createAsyncThunk } from "@reduxjs/toolkit";
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// //Include Both Helper File with needed methods
// import {
//     getUsers as getUsersDataApi,
//     addNewUser as addNewUserApi,
//     updateUser as updateUserApi,
//     deleteUser as deleteUserApi,

//     //university
//     getUniversityInfo as getUniversityInfoApi,
//     updateUniversity as updateUniversityApi

// } from "../../helpers/backend_helper";

// export const getUsersData = createAsyncThunk("setting/getUsersData", async () => {
//     try {
//         // console.log("called users data");
//         const response = await getUsersDataApi();
//         return response;
//     } catch (error) {
//         return error;
//     }
// });

// export const adduser = createAsyncThunk("setting/adduser", async (user, { dispatch }) => {
//     try {
//         await addNewUserApi(user);
//         toast.success("User Data saved Successfully", { autoClose: 3000 });
//         dispatch(getUsersData());

//     } catch (error) {
//         toast.error("user Data Failed to save", { autoClose: 3000 });
//         return error;
//     }
// });

// export const updateUser = createAsyncThunk("team/updateTeamData", async (user, { dispatch }) => {
//     try {
//         await updateUserApi(user);
//         toast.success("user Updated Successfully", { autoClose: 3000 });
//         dispatch(getUsersData());
//     } catch (error) {
//         toast.error("User Failed to update", { autoClose: 3000 });
//         return error;
//     }
// });

// export const deleteUser = createAsyncThunk("team/deleteTeamData", async (user, { dispatch }) => {
//     try {
//         await deleteUserApi(user);
//         toast.success("User Deleted Successfully", { autoClose: 3000 });
//         dispatch(getUsersData());
//     } catch (error) {
//         toast.error("User Failed to delete", { autoClose: 3000 });
//         return error;
//     }
// });

// //=============================================UNIVERSITY===================================

// export const getUniversityInfo = createAsyncThunk("setting/getUniData", async () => {
//     try {

//         const response = await getUniversityInfoApi();
//         return response;
//     } catch (error) {
//         return error;
//     }
// });


// export const updateUniversity = createAsyncThunk("setting/updateUniData", async (uni, { dispatch }) => {
//     try {
//         await updateUniversityApi(uni);
//         toast.success("university data Updated Successfully", { autoClose: 3000 });
//         dispatch(getUniversityInfo());
//     } catch (error) {
//         toast.error("university data Failed to update", { autoClose: 3000 });
//         return error;
//     }
// });


// src/slices/settings/thunk.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { UserAPI, UniversityAPI } from "../../helpers/backend_helper";

// Users
export const getUsersData = createAsyncThunk("setting/getUsersData", async () => {
    const res = await UserAPI.list();
    if (!res.success) throw res;
    return res.data;
});

export const addUser = createAsyncThunk("setting/addUser", async (user, { dispatch }) => {
    const res = await UserAPI.create(user);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

export const updateUser = createAsyncThunk("setting/updateUser", async (user, { dispatch }) => {
    const res = await UserAPI.update(user);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

export const deleteUser = createAsyncThunk("setting/deleteUser", async (id, { dispatch }) => {
    const res = await UserAPI.delete(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

// University
export const getUniversityInfo = createAsyncThunk("setting/getUniData", async () => {
    const res = await UniversityAPI.get();
    if (!res.success) throw res;
    return res.data;
});

export const updateUniversity = createAsyncThunk("setting/updateUniData", async (uni, { dispatch }) => {
    const res = await UniversityAPI.update(uni);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUniversityInfo());
    return res;
});
