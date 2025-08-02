import React, { useEffect, useState } from 'react'
import useCheckUser from '../hooks/useCheckUser'
import axios from 'axios';
import { USER_ENDPOINT_API } from '../utils/apiEndPoint';
import { useDispatch, useSelector } from 'react-redux';
import { CircularProgress, Backdrop } from "@mui/material";
import { Link, useNavigate } from 'react-router-dom';
import { setSliceName, setSliceUserId, setSliceUserName } from '../redux/authSlice';
import toast from 'react-hot-toast';

export default function History() {
    useCheckUser();
    let dispatch = useDispatch();
    let navigate = useNavigate();

    let [allMessages, setAllMessages] = useState([]);
    let user_id = useSelector((state) => state.auth.id)
    let [open, setOpen] = useState(true);

    useEffect(() => {

        let getAllHistory = async () => {
            if (user_id != null) {
                try {
                    setOpen(true);
                    let res = await axios.post(`${USER_ENDPOINT_API}/getCurrUserAllMeetings`, { user_id }, {
                        headers: {
                            "Content-Type": "application/json"
                        },

                        withCredentials: true
                    })

                    if (res.data.success) {
                        setAllMessages(res.data.allMeetings);
                    }
                }
                catch (e) {
                    console.log(e?.response?.data?.message)
                }
                finally {
                    setOpen(false);
                }
            }
        }

        getAllHistory();
    }, [user_id])

    let logoutHandler = async () => {
        try {
            let res = await axios.get(`${USER_ENDPOINT_API}/logout`, { withCredentials: true })
            if (res.data.success) {
                toast.success("Logged out sucessfully")
                dispatch(setSliceUserName(null));
                dispatch(setSliceName(null));
                dispatch(setSliceUserId(null));
                navigate("/");
            }
        }
        catch (e) {
            toast.error(e?.response?.data?.message)
        }
    }

    return (
        <div>
            {
                open ? (
                    <Backdrop open={open} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                        <CircularProgress color="inherit" />
                    </Backdrop>
                ) : (
                    <div>
                        <nav className="navbar">
                            <div className="navHeader">
                                <h2>
                                    <Link style={{ textDecoration: "none", color: "black" }} to={"/"}>Zoom Video Call</Link>
                                </h2>
                            </div>
                            <div className="navList">
                                <ul>
                                    <li className="navItem">
                                        <div role="button" className="navLogoutBtn" onClick={logoutHandler}>
                                            Logout
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </nav>

                        {allMessages.length === 0 ? (
                            <div className="historyEmpty">
                                <h2>You haven't attended any meetings yet!</h2>
                            </div>
                        ) : (
                            <div className="historyContainer">
                                <h2 className="historyTitle">Meeting History</h2>
                                <div className="historyList">
                                    {allMessages.map((elm, ind) => (
                                        <div key={ind} className="historyCard">
                                            <p><strong>Meeting Code:</strong> {elm.meetingCode}</p>
                                            <p><strong>Date:</strong> {new Date(elm.createdAt).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )
            }

        </div>
    )
}
