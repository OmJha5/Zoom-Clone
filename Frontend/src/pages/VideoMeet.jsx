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
import useCheckUserWithoutNavigating from '../hooks/useCheckUserWithoutNavigating';
import { backend_url } from '../utils/apiEndPoint';

let server_url = `${backend_url}`;

var connections = {};

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" } // we are using google turn servers for NAT traversal
    ]
}

export default function VideoMeetComponent() {
    let navigate = useNavigate();
    let user_id = useSelector((state) => state.auth.id);

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();
    let videoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState();
    let [audioAvailable, setAudioAvailable] = useState();
    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(true);
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [screen, setScreen] = useState();

    let [videos, setVideos] = useState([])
    let [username, setUsername] = useState("");
    let screenRef = useRef();


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
            let tracks = [];

            try {
                if (audioAvailable) {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    tracks.push(...audioStream.getAudioTracks());
                    window.localAudioStream = audioStream;
                }
            }
            catch (err) {
                console.warn("Audio access failed:", err);
            }

            try {
                if (videoAvailable) {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    tracks.push(...videoStream.getVideoTracks());
                }
            }
            catch (err) {
                console.warn("Video access failed:", err);
            }

            tracks = new MediaStream(tracks);

            if (tracks) {
                window.localStream = tracks;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = tracks;
                }
            }
        }

        if (videoAvailable != undefined && audioAvailable != undefined) getStream(); // That means pehle permission lelo audio and video then yeh chalao

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

        if (screenRef.current != true) { // why we wrote this if and below if ? -- because jab screen sharing chalu hai then if user toggles audio (not video because screen sharing mai video nhi hogi chalu coding) then direct yahi function execute hoga and agar hum tracks stop kardenge localStream ke ya replaceTrack use kardenge to woh screensharing track ko video Track mai replace kardega and that will break the code
            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => track.stop());
                }
            }
            catch (e) {
                console.log(e);
            }

            window.localStream = stream;
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            const pc = connections[id]; // peerconnection

            // AUDIO TRACK HANDLING (optional)

            if (window.localAudioStream) {
                const audioTrack = window.localAudioStream.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = audio ? true : false;
                }
            }

            const videoTrack = stream.getVideoTracks().length > 0 ? stream.getVideoTracks()[0] : undefined;
            const senders = pc.getSenders(); // getSenders() because for this client we are sending our tracks to conenctions[id] and connections[id] they will use getReceivers() to get all tracks from us.

            // VIDEO TRACK HANDLING
            const videoSender = senders.find(s => s.track?.kind === 'video'); // ? because tracks can be null when we are turning off the screen sharing.

            if (screenRef.current != true) { // why if because of above reason .
                if (video && videoTrack) {
                    if (videoSender) { // This if will run when we are just entering the room with camera on
                        videoSender.replaceTrack(videoTrack);
                        socketRef.current.emit("force-update", id);
                    }
                    else { // This will run when we are turning on our camera and in this process we don't have any video track (only null track when we turn off the video) so we have to add it and negotiate
                        pc.addTrack(videoTrack, stream);
                        renegotiate(pc, id);
                    }
                }
                else {
                    if (videoSender) { // When we will turn off the camera
                        videoSender.replaceTrack(null);
                        socketRef.current.emit("force-update", id);
                    }
                }
            }

        }
    };

    function renegotiate(pc, remoteId) {
        pc.createOffer()
            .then(desc => pc.setLocalDescription(desc))
            .then(() => {
                socketRef.current.emit('signal', remoteId, JSON.stringify({ sdp: pc.localDescription }));
            })
            .catch(console.log);
    }

    let getUserMedia = () => {
        if (video || audio) {
            // when .then and catch will run ?
            // jab browser ne jo video and audio ka access diya hai agar wahi yaha pe likha hai then woh stream ke sath .then chal jayega 
            // eg agar browser ne video ka access nhi diya and audio diya hai and yaha pe video : true karke koshish karenge then .catch chal jayega
            // and if browser ne access diya hua hai to either aap yeh true ke sath aao ya false doesn't matter 
            async function getCombinedStream() {
                const tracks = [];

                try {
                    if (audio) {
                        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audio });
                        tracks.push(...audioStream.getAudioTracks());
                    }
                }
                catch (err) {
                    console.warn("Audio access failed:", err);
                }

                try {
                    if (video) {
                        const videoStream = await navigator.mediaDevices.getUserMedia({ video: video });
                        tracks.push(...videoStream.getVideoTracks());
                    }
                }
                catch (err) {
                    console.warn("Video access failed:", err);
                }

                return new MediaStream(tracks);
            }

            getCombinedStream()
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
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

    let handleAttach = async (socketListId, stream) => {
        if (!stream || !stream.getTracks().length) return;

        // Prevent attaching your own stream
        if (socketListId === socketIdRef.current) return;

        setVideos((videos) => {
            const videoExists = videos.find(video => video.socketId === socketListId);

            if (videoExists) {
                // Update stream
                const updated = videos.map(video =>
                    video.socketId === socketListId ? { ...video, stream } : video
                );

                videoRef.current = updated;
                return updated;
            }
            else {
                // Add new stream
                const newVideo = {
                    socketId: socketListId,
                    stream,
                    autoplay: true,
                    playsinline: true
                };
                const updated = [...videos, newVideo];
                videoRef.current = updated;
                return updated;
            }
        });
    };



    let connectToSocketServer = () => {

        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('connect', () => {

            socketRef.current.on('signal', gotMessageFromServer)
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on("force-update", (fromId) => {

                const pc = connections[fromId];
                if (!pc) return;

                const receivers = pc.getReceivers(); // Because yeh fromId se uske streams lega aur apne videos array ko update karega . That is why yeh uske liye receiver hai . each pc has getSenders() and getReceivers()
                let videoTrack = null;
                let audioTrack = null;

                for (const receiver of receivers) {
                    if (receiver.track == null) {
                        console.log("Receiver with null track:", receiver);
                        continue;
                    }

                    if (receiver.track.kind === "video") {
                        videoTrack = receiver.track;
                    }
                    else if (receiver.track.kind === "audio") {
                        audioTrack = receiver.track;
                    }
                }

                const tracks = [];
                if (videoTrack) tracks.push(videoTrack);
                if (audioTrack) tracks.push(audioTrack);

                const stream = new MediaStream(tracks);
                handleAttach(fromId, stream);
            });


            socketRef.current.on('user-joined', (id, clients) => {

                clients.forEach((socketListId) => { // eg [A , [A , B , C]]

                    if (socketIdRef.current == socketListId) return; // Curr client khud se thodi connection banayega
                    if (connections[socketListId]) return; // if yes then current browser client already has connection with this socket if yes then agar handshake hogaya hai to phir se kyu karen that is the concept. they are already in a single room

                    // Create a WebRTC connection with settings in peerConfigConnections and store it using the other user’s ID.”
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    // onicecandidate is a handler that will start ICE Gathering jab for this client connections[socketListId].localDescription() chal jaata hai   
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].ontrack = (event) => {
                        const [stream] = event.streams;

                        handleAttach(socketListId, stream);

                    };

                    if (id == socketListId) { // so that new user do not send intial stream to the old user because that will ultimately happen after this
                        // New user just creates the offer , streams and send it to the old user 
                        // Old user in return just added their stream to new user as initial setup so that connection can be estabished 
                        // And in this case Old user don't have to create any offer because that is being done from new user
                        // Once connection is estabilished then which ever client has to send stream then it can send and other will receive it.
                        if (window.localStream !== undefined && window.localStream !== null) {
                            window.localStream.getTracks().forEach(track => {
                                connections[socketListId].addTrack(track, window.localStream);
                            });
                        }
                        else {
                            let blackSilence = (...args) => new MediaStream([black(...args), silence()]) // It is silent media stream because in intial setup if no stream then still we have to add it
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
            if (screenRef.current) {
                // That means screen sharing is going on to screen sharing off karke hi karo
                toast.error("Please first off the screen sharing")
            }
            else setVideo(!video);
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

    let getDisplayMediaSucess = async (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        }
        catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            let pc = connections[id];
            let sender = pc.getSenders().find((s) => s.track && s.track.kind == "video");
            let videoTrack = stream.getVideoTracks()[0];

            if (!sender) {
                console.log("Don't have video track")
            }
            else {
                sender.replaceTrack(videoTrack)
                socketRef.current.emit("force-update", id);
            }
        }

        stream.getTracks().forEach(track => track.onended = () => { // it is checking if any screen sharing track is ended if yes means user ne screen share band kar diya hai 
            screenRef.current = false;
            setScreen(false);

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
                // navigator.mediaDevices.getDisplayMedia() -- It is an API for Screen sharing
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }) // video means you are sharing your screen and audio means your systam audio inka eak stream
                    .then(getDisplayMediaSucess)
                    .catch(() => { // when user ne kon kon si screen choose karni hai uss prompt ko nhi diya then yeh .catch chalega
                        screenRef.current = false;
                        setScreen(false);
                    })
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        if (screenRef.current == true) {
            getDisplayMedia();
        }

    }, [screen])

    let handleScreen = () => {
        if (screenAvailable == false) {
            toast.error("Your device can not share the screen");
            return;
        }

        if (screenRef.current == true) { // that means screen sharing off karna hai to jo niche likha aata hai wahi se karo kyuki usse function trigger hoga jo ultimately screen ko false kar hi dega
            return;
        }

        if (video == false) { // now it is gurantted that before screen sharing video always on rhega
            toast.error("Please turn on your video for screen sharing");
            return;
        }

        if (screenRef.current == undefined) {
            screenRef.current = true;
            setScreen(true);
        }
        else {
            screenRef.current = !screenRef.current;
            setScreen(!screen);
        }
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

    let cleanupConnections = () => {
        if (socketRef.current) {
            socketRef.current.emit("manual-disconnect");
        }

        // Clean up peer connections
        for (let id in connections) {
            if (connections[id]) {
                connections[id].close();
                delete connections[id];
            }
        }

        // Stop media tracks
        if (window.localStream) {
            window.localStream.getTracks().forEach((track) => track.stop());
        }
    }

    useEffect(() => {
        const handleBeforeUnload = () => {
            cleanupConnections();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    let endCall = () => {
        cleanupConnections();
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
                                {screenRef.current === true ? <ScreenShareIcon onClick={handleScreen} /> : <StopScreenShareIcon onClick={handleScreen} />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={handleModal} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>


                    <video className="meetUserVideo" ref={localVideoref} autoPlay muted={true}></video>

                    <div className="videoDiv">
                        {videos.map((video, ind) => (
                            <div key={ind} className='singleVideo'>
                                <video

                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}

                                    autoPlay
                                    muted={false}
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