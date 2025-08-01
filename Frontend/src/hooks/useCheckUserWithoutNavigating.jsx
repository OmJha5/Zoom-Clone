import {useEffect} from "react"
import { useDispatch } from 'react-redux'
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { USER_ENDPOINT_API } from "../utils/apiEndPoint";
import { setSliceName, setSliceUserId, setSliceUserName } from "../redux/authSlice";
import toast from "react-hot-toast";

const useCheckUserWithoutNavigating = () => {
    let dispatch = useDispatch();
    let navigate = useNavigate();

    useEffect(() => {
        const checkUser = async() => {
            try{
                let res = await axios.get(`${USER_ENDPOINT_API}/checkuser` , {
                    withCredentials : true,
                });

                if(res.data.success){
                    dispatch(setSliceName(res.data.user.name));
                    dispatch(setSliceUserName(res.data.user.username));
                    dispatch(setSliceUserId(res.data.user._id));
                    return;
                }
            }
            catch(e){ console.log(e) }
        }

        checkUser();
    } , [])
}

export default useCheckUserWithoutNavigating;