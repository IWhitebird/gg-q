import { createSlice , PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../types';


interface UserState {
    user : IUser | null;
    logged : boolean;
}


const initialState : UserState = {
    user : localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    logged : localStorage.getItem('user') ? true : false,
}

const userSlice = createSlice({
    name : 'user',
    initialState: initialState,
    reducers : {
        setUser(state : UserState , action : PayloadAction<IUser>) {
            state.user = action.payload;
            state.logged = true;
            localStorage.setItem('user', JSON.stringify(action.payload));
        }
    },
});

export const { setUser } = userSlice.actions;

export default userSlice.reducer;