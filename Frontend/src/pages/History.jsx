import React, { useEffect, useState } from 'react'
import useCheckUser from '../hooks/useCheckUser'
import axios from 'axios';
import { USER_ENDPOINT_API } from '../utils/apiEndPoint';
import { useSelector } from 'react-redux';
import { CircularProgress, Backdrop } from "@mui/material";

export default function History() {
    useCheckUser();

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

    return (
        <div>
            {
                open ? (
                    <Backdrop open={open} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                        <CircularProgress color="inherit" />
                    </Backdrop>
                ) : (
                    allMessages.length == 0 ? (
                        <h1>You Have not attended any meeting yet!</h1>
                    ) : (
                        allMessages.map((elm, ind) => {
                            return <div key={ind} >
                                <p>{elm.meetingCode}</p>
                                <p>{elm.createdAt}</p>
                            </div>
                        })
                    )
                )
            }

        </div>
    )
}
