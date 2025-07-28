import {useEffect} from "react"
import { useDispatch } from 'react-redux'
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { USER_ENDPOINT_API } from "../utils/apiEndPoint";
import { setSliceName, setSliceUserName } from "../redux/authSlice";
import toast from "react-hot-toast";

const useCheckUser = () => {
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
                    return;
                }
            }
            catch(e){
                toast.error(e?.response?.data?.message)
                navigate("/auth");
            }
        }

        checkUser();
    } , [])
}

export default useCheckUser;