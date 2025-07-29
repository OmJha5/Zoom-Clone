import { isAllOf } from '@reduxjs/toolkit';
import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client';

const server_url = "http://localhost:8080";

let connections = {};

// Below is our stun server configuration for WebRTC
const peerConnectionConfig = {
    "iceServers": [
        {
            "urls": "stun:stun.l.google.com:19302"
        }
    ]
};

export default function VideoMeet() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState();
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUserName, setAskForUserName] = useState(true);
    let [userName, setUserName] = useState("");

    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            }

            if (navigator.mediaDevices.getDisplayMedia) { // kya user browser capable hai screen share karne ke liye ?
                setScreenAvailable(true);
            }
            else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio: audioAvailable
                });

                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        }
        catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {

        getPermissions();
    }, [])

    let getUserMediaSuccess = (stream) => {
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(() => getUserMediaSuccess) // TODO : getUserMediaSuccess
                .then((stream) => { })
                .catch((e) => console.log(e));
        }
        else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach((track) => {
                    track.stop();
                });
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    useEffect(() => {
        if (video != undefined && audio != undefined) {
            getUserMedia();
        }
    }, [audio, video])

    let gotMessageFromServer = (fromId, message) => {
        let signal = JSON.parse(message);

        if(fromId != socketIdRef.current) {
            if(signal.sdp){
                connections[fromId].setRemoteDescription(new RTCsessionDescripition(signal.sdp)).then(() => {
                    if(signal.sdp.type == "offer"){
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal" , fromId , JSON.stringify({"sdp" : connections[fromId].localDescription}))
                            }) .catch(e => console.log(e));
                        }) .catch(e => console.log(e));
                    }
                }) .catch(e => console.log(e));
            }

            if(signal.ice){
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }

    let addMessage = () => {

    }

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

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
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


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    }
                    else {
                        // TODO
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        }
                        catch (e) { }

                        connections[id2].createOffer().then((description) => { // The SDP offer is a text description that includes: media capabilities(audio , video) , shren sharing capabilities, and network information.
                            connections[id2].setLocalDescription(description) // This tells the browser: “This is the offer I’m going to send to the other peer.” Internally, this triggers the ICE framework to begin gathering candidates.
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let connect = () => {
        setAskForUserName(false);
        getMedia();
    }
    return (
        <div>
            {
                askForUserName == true ? (
                    <div>
                        <h2>Enter Into Lobby</h2>
                        <input type="text" placeholder='Enter Your Name' value={userName} onChange={(e) => setUserName(e.target.value)} />
                        <button onClick={connect}>Connect</button>

                        <div>
                            <video ref={localVideoRef} autoPlay muted></video>
                        </div>
                    </div>
                ) : <></>
            }
        </div>
    )
}
