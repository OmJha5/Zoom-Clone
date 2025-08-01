import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name : "auth",
    initialState : {
        name : null,
        username : null,
        id : null,
    },
    reducers : {
        setSliceName : (state , action) => {
            state.name = action.payload;
        },

        setSliceUserName : (state , action) => {
            state.username = action.payload;
        },

        setSliceUserId : (state , action) => {
            state.id = action.payload;
        }
    }
});

export const {setSliceName , setSliceUserName , setSliceUserId} = authSlice.actions;
export default authSlice.reducer;