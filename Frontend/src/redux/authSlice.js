import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name : "auth",
    initialState : {
        name : null,
        username : null
    },
    reducers : {
        setSliceName : (state , action) => {
            state.name = action.payload;
        },

        setSliceUserName : (state , action) => {
            state.username = action.payload;
        }
    }
});

export const {setSliceName , setSliceUserName} = authSlice.actions;
export default authSlice.reducer;