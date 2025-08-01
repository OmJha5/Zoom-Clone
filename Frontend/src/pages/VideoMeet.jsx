import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import "../styles/videoComponent.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { USER_ENDPOINT_API } from '../utils/apiEndPoint';
import useCheckUser from '../hooks/useCheckUser';
import useCheckUserWithoutNavigating from '../hooks/useCheckUserWithoutNavigating';
import { backend_url } from '../utils/apiEndPoint';

let server_url = `${backend_url}`;

var connections = {};

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    let dispatch = useDispatch();
    let navigate = useNavigate();
    let user_id = useSelector((state) => state.auth.id);

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();
    let videoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(true);
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);

    let [videos, setVideos] = useState([])
    let [username, setUsername] = useState("");

    const modalOpenRef = useRef(false);

    useEffect(() => {
        modalOpenRef.current = showModal;
    }, [showModal]);

    useCheckUserWithoutNavigating();

    useEffect(() => {
        if (setAskForUsername) {
            let permission = async () => {
                await getPermissionsForAudio();
                await getPermissionsForVideo();

                if (navigator.mediaDevices.getDisplayMedia) { // that means user device can share the screen
                    setScreenAvailable(true);
                }
                else setScreenAvailable(false);
            }

            permission();
        }

    }, [setAskForUsername])

    useEffect(() => {
        let getStream = async () => {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
            if (userMediaStream) {
                window.localStream = userMediaStream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = userMediaStream;
                }
            }
        }

        getStream();

    }, [videoAvailable, audioAvailable])

    const getPermissionsForVideo = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) setVideoAvailable(true);
        }
        catch (e) {
            setVideoAvailable(false);
        }
    }

    const getPermissionsForAudio = async () => {
        try {
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) setAudioAvailable(true);
        }
        catch (e) {
            setAudioAvailable(false);
        }
    }

    // Whenever logged in user clicks on connect then we have to save their meeting history in database.
    let updateMeetingsForCurrUser = async () => {
        if (user_id != null) {
            // That means curr logged in user hai guest nhi hai kyuki guest ka option sirf logout user ko hi dikhta hai .
            const path = window.location.pathname; // e.g., "/meeting-with-neha"
            const code = path.split("/").pop(); // "meeting-with-neha"
            try {
                let res = await axios.post(`${USER_ENDPOINT_API}/addCurrMeeting`, { user_id, code }, {
                    headers: {
                        "Content-Type": "application/json"
                    },

                    withCredentials: true
                })
            }
            catch (e) {
                console.log(e);
            }

        }
    }

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }


    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            window.localStream.getTracks().forEach(track => {
                connections[id].addTrack(track, window.localStream);
            });

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            }).catch(e => console.log(e))
        }
    }

    let getUserMedia = () => {
        if (video || audio) {
            // when .then and catch will run ?
            // jab browser ne jo video and audio ka access diya hai agar wahi yaha pe likha hai then woh stream ke sath .then chal jayega 
            // eg agar browser ne video ka access nhi diya and audio diya hai and yaha pe video : true karke koshish karenge then .catch chal jayega
            // and if browser ne access diya hua hai to either aap yeh true ke sath aao ya false doesn't matter 
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log("This is an error"))
        }
        else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }


    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {

                        connections[fromId].createAnswer().then((description) => { // It now sends their media capabilites to the client from where this offer came
                            connections[fromId].setLocalDescription(description).then(() => { // localdescription set means now it will send their ICE candidate its own ip and port to the client from where this offer came and after that a network path will be estabilished.
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            // Means -> I just received an ICE candidate(PUBLIC IP + PORT INFO) from the other peer. I’ll now try to use it to establish a direct connection
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    // This addMessage is a closure function that is why when you are in closure then update you states like prev => because it always refer to the newest value
    // And when in a closure you have to access the state then use UseRef because state can be staled .
    let addMessage = (data, sender, socketId) => {
        let newMessage = { data, sender, socketId };
        setMessages(prevMessages => [...prevMessages, newMessage]);

        if (socketRef.current.id !== socketId && !modalOpenRef.current) {
            setNewMessages(prev => prev + 1);
        }
    };

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {

                clients.forEach((socketListId) => {

                    if (socketIdRef.current == socketListId) return;

                    if (connections[socketListId]) return; // if yes then current browser client already has connection with this socket if yes then agar handshake hogaya hai to phir se kyu karen that is the concept. they are already in a single room

                    // Create a WebRTC connection with settings in peerConfigConnections and store it using the other user’s ID.”
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    // onicecandidate is a handler so      
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].ontrack = (event) => {
                        const [stream] = event.streams;

                        let videoExists = videoRef.current?.find(video => video.socketId === socketListId);

                        if (videoExists) {

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            let newVideo = {
                                socketId: socketListId,
                                stream: stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    if (id == socketListId) { // so that new user do not send intial stream to the old user because that will ultimately happen after this
                        // New user just creates the offer , streams and send it to the old user 
                        // Old user in return just added their stream to new user as initial setup so that connection can be estabished 
                        // And in this case Old user don't have to create any offer because that is being done from old user
                        // Once connection is estabilished then which ever client has to send stream then it only negotiates with new stream and offer rest clients will just answer their offer.
                        if (window.localStream !== undefined && window.localStream !== null) {
                            window.localStream.getTracks().forEach(track => {
                                connections[socketListId].addTrack(track, window.localStream);
                            });
                        }
                        else {
                            let blackSilence = (...args) => new MediaStream([black(...args), silence()]) // It will silent media stream because in intial setup if no stream then still we have to add it
                            window.localStream = blackSilence()
                            window.localStream.getTracks().forEach(track => {
                                connections[socketListId].addTrack(track, window.localStream);
                            });
                        }
                    }
                })

                // Signaling(Our own nodejs server it is just a message exchange part) is the process of exchanging metadata between two peers so they can establish a peer-to-peer connection.
                // It includes the exchange of:
                // SDP (Session Description Protocol) — describes media capabilities
                // ICE candidates — describes how to reach each other (IP, port, protocols)
                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            window.localStream.getTracks().forEach(track => {
                                connections[id2].addTrack(track, window.localStream);
                            });
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        }).catch((e) => console.log(e));
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        if (videoAvailable == true) {
            setVideo(!video);
        }
        else toast.error("You can not turn on video because you have blocked the access");
    }

    let handleAudio = () => {
        if (audioAvailable == true) {
            setAudio(!audio);
        }
        else toast.error("You can not turn on audio because you have blocked the access");
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
        updateMeetingsForCurrUser();
    }

    /*
    "In WebRTC, once users are connected, their video or audio flows live without needing to send anything again. If the user’s stream stays the same — like just changing the webcam content — it keeps working.
    But if the user adds a new stream (like screen sharing) or removes one, we need to inform the other person by creating a new offer. That’s called renegotiation."
    */
    let getDisplayMediaSucess = async (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        }
        catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            window.localStream.getTracks().forEach(track => {
                connections[id].addTrack(track, window.localStream);
            });

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            }).catch((e) => console.log(e));
        }

        stream.getTracks().forEach(track => track.onended = () => { // it is checking if any track is ended if yes means user ne screen share band kar diya hai 
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            getUserMedia()

        })
    }

    let getDisplayMedia = async () => {
        try {
            if (screen) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }) // video means you are sharing your screen and audio means your systam audio inka eak stream
                    .then(getDisplayMediaSucess)
                    .catch(() => { // when user ne kon si screen shose karni hai uss prompt ko nhi diya then yeh .catch chalega
                        setScreen(false);
                    })
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        if (screen != undefined) {
            getDisplayMedia();
        }
    }, [screen])

    let handleScreen = () => {
        if (screenAvailable == false) {
            toast.error("Your device can not share the screen");
        }

        if (screenAvailable == undefined) {
            setScreen(true);
        }
        else setScreen(!screen);
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }

    let handleModal = () => {
        if (!showModal) {
            setModal(true);
            setNewMessages(0);
        }
        else {
            setModal(false);
        }
    }

    useEffect(() => {
        return () => {

            // This is a cleanup function and iske trigger hote hi we have to do all things to remove curr person from the meeting
            socketRef.current.emit("user-left");

            // Close all peer connections
            for (let id in connections) {
                connections[id].close();
            }

            // Stop all media 
            if (window.localStream) {
                window.localStream.getTracks().forEach((track) => track.stop());
            }

        }
    }, [])

    let endCall = () => {
        navigate("/")
    }

    return (
        <div>

            {askForUsername === true ?

                <div className='lobbyContainer'>


                    <h2>Enter into Lobby </h2>
                    <div className="infoContainer">
                        <TextField id="outlined-basic" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} variant="outlined" />
                        <Button variant="contained" onClick={connect}>Connect</Button>
                    </div>


                    <div>
                        <video ref={localVideoref} autoPlay muted></video> 
                        {/* autoplay means video will play immediately without user effect */}
                    </div>


                    {/* Case	                  Can you hear your own voice?	          Can others hear your voice?
                        muted is present	      ❌ No	                                ✅ Yes
                        muted is not present	  ✅ Yes (you hear your surroundings)	✅ Yes */}


                </div> :


                <div className="meetVideoContainer">


                    <div className="buttonContainer">
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton style={{ color: "red" }} onClick={endCall}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon onClick={handleScreen} /> : <StopScreenShareIcon onClick={handleScreen} />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={handleModal} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>


                    <video className="meetUserVideo" ref={localVideoref} autoPlay></video>

                    <div className="videoDiv">
                        {videos.map((video, ind) => (
                            <div key={ind} className='singleVideo'>
                                <video

                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}

                                    muted
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

                    {showModal && (
                        <div className="chatRoom">
                            <div className="chatContainer">
                                <h1>Chat</h1>

                                <div className="chatDisplay">
                                    {messages.map((elm, ind) => (
                                        <div key={ind} className={`chatMessage ${(socketIdRef.current != elm.socketId) ? "white" : "blue"}`}>
                                            <p className={`chatSender`} >{elm.sender}</p>
                                            <p className="chatText">{elm.data}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="chattingArea infoContainer">
                                    <TextField className='chattTxt' id="outlined-basic" value={message} onChange={(e) => setMessage(e.target.value)} label="Enter your message" variant="outlined" />
                                    <Button variant="contained" className='btn' onClick={sendMessage}>Send</Button>
                                </div>
                            </div>

                        </div>
                    )}

                </div>

            }

        </div>
    )
}