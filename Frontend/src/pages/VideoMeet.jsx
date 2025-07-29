import { isAllOf } from '@reduxjs/toolkit';
import React, { useEffect, useRef, useState } from 'react'
import {io} from 'socket.io-client';

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

    let [videoAvailable , setVideoAvailable] = useState(true);
    let [audioAvailable , setAudioAvailable] = useState(true);
    let [video , setVideo] = useState();
    let [audio , setAudio] = useState();
    let [screen , setScreen] = useState();
    let [showModal , setModal] = useState();
    let [screenAvailable , setScreenAvailable] = useState();
    let [messages , setMessages] = useState([]);
    let [message , setMessage] = useState("");
    let [newMessages , setNewMessages] = useState(0);
    let [askForUserName , setAskForUserName] = useState(true);
    let [userName , setUserName] = useState("");

    const videoRef = useRef([]);
    let [videos , setVideos] = useState([]);

    const getPermissions = async () => {
        try {  
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true});
            if(videoPermission){
                setVideoAvailable(true);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true});
            if(audioPermission){
                setAudioAvailable(true);
            }

            if(navigator.mediaDevices.getDisplayMedia){ // kya user browser capable hai screen share karne ke liye ?
                setScreenAvailable(true);
            }
            else{
                setScreenAvailable(false);
            }

            if(videoAvailable || audioAvailable){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio : audioAvailable
                });

                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        }
        catch(e){
            console.log(e);
        }
    }

    useEffect(() => {

        getPermissions();
    } , [])

    let getUserMediaSuccess = (stream) => {
    }

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable)){
            navigator.mediaDevices.getUserMedia({video : video , audio : audio})
            .then(() => getUserMediaSuccess) // TODO : getUserMediaSuccess
            .then((stream) => {})
            .catch((e) => console.log(e));
        }
        else{
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach((track) => {
                    track.stop();
                });
            }
            catch(e){
                console.log(e);
            }
        }
    }

    useEffect(() => {
        if(video != undefined && audio != undefined){
            getUserMedia();
        }
    } , [audio , video])

    let gotMessageFromServer = (fromId , message) => {

    }

    let addMessage = () => {

    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url , {secure : false});
        socketRef.current.on("signal" , gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call" , window.location.href);
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on("chat-message" , addMessage);
            socketRef.current.on("user-left" , (id) => {
                //TODO
            })
        });
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
