import React, { useState } from 'react'
import useCheckUser from '../hooks/useCheckUser'
import { Link, useNavigate } from 'react-router-dom';
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore'
import toast from 'react-hot-toast';
import axios from 'axios';
import { USER_ENDPOINT_API } from '../utils/apiEndPoint';
import { useDispatch } from 'react-redux';
import { setSliceName, setSliceUserId, setSliceUserName } from '../redux/authSlice';

export default function HomePage() {
  let dispatch = useDispatch();
  let navigate = useNavigate();

  useCheckUser();
  let [meetingCode, setMeetingCode] = useState("");

  let logoutHandler = async() => {
    try{
      let res = await axios.get(`${USER_ENDPOINT_API}/logout` , {withCredentials : true})
      if(res.data.success){
        toast.success("Logged out sucessfully")
        dispatch(setSliceUserName(null));
        dispatch(setSliceName(null));
        dispatch(setSliceUserId(null));
        navigate("/");
      }
    }
    catch(e){
      toast.error(e?.response?.data?.message)
    }
  }

  let meetingCodeHandler = () => {
    navigate(`/${meetingCode}`)
  }

  return (
    <div>
      <div>
        <nav className="navbar">
          <div className="navHeader">
            <h2>
              <Link style={{ textDecoration: "none", color: "black" }} to={"/"}>Zoom Video Call</Link>
            </h2>
          </div>
          <div className="navList">
            <ul>

              <li onClick={() => navigate("/history")}>
                <IconButton >
                  <RestoreIcon  />
                </IconButton>
                History
              </li>

              <li>
                <div role="button" onClick={logoutHandler}>
                  Logout
                </div>
              </li>
            </ul>

          </div>
        </nav>

        <div className="meetContainer">
          <div className="leftPanel">
            <div>
              <h2 className='heading'>Delivering Crystal Clear Video Calls, Every Time</h2>

              <div className='infoContainer'>
                <TextField className='input' id="outlined-basic" label="Create the code or join the one" style={{ margin: "30px 0px" }} value={meetingCode} onChange={(e) => setMeetingCode(e.target.value)} variant="outlined" />
                <Button variant="contained" onClick={meetingCodeHandler} className='btn'>Join</Button>
              </div>


            </div>
          </div>

          <div className="rightPanel">
            <img className='rightImage' src="../public/images/logo3.png" alt="" />
          </div>
        </div>
      </div>



    </div>
  )
}
