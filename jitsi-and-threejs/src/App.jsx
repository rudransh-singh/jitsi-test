
import React, { useEffect } from 'react';
import useJitsiMeetJS from './JitsiMeetJS';
import { Canvas, useFrame } from "@react-three/fiber";
import { useState } from 'react';
import $ from 'jquery';
import { useGlobalState, setGlobalState } from './globalStates';


/** 
Function for displaying the Local Video Tracks as boxes.
Takes input as the array of Local Video Tracks
*/
function VideoTracksLocal({ arr }) {
    console.log(arr); // 👉️ ['A', 'B', 'C', 'D']
    const newarr = arr.map((item) => {
        return item.containers[0].id;
    }
    )
    console.log("new arr is ", newarr);
    return (
        newarr.map((item) => {
            return <MyRotatingBox x={0} y={0} key={item} divid={item} />
        }
        )
    )
}

/**
Function for displaying the Remote Video Tracks as boxes.
Takes input as the array of Remote Video Tracks
 */
function VideoTracksRemote({ arr }) {

    console.log("using video tracks remote here", arr); // 👉️ ['A', 'B', 'C', 'D']
    const newarr = []
    arr.forEach(element => {
        console.log("element disposed", element.disposed)
        if (element.disposed === false) {
            newarr.push(element.containers[0].id);
        }
    });
    console.log("new arr remote is ", newarr);
    console.log("using video tracks remote here new video is", newarr);
    return (
        newarr.map((item, index) => {
            return <MyRotatingBox x={5} key={item} divid={item} y={-1.5 * index} />
        }
        )
    )
}

/**
Function for displaying a Rotating Box on the screen
Three props are required
* 
x: x-coordinate of the box
* 
y: y-coordinate of the box
* 
divid: id of the box
 */
function MyRotatingBox(props) {
    const myMesh = React.useRef();
    useFrame(({ clock }) => {
        const a = clock.getElapsedTime();
        myMesh.current.rotation.x = a;
        myMesh.current.position.x = props.x;
        myMesh.current.position.y = props.y;
    });
    const [video] = useState(() =>
        Object.assign(document.getElementById(props.divid)));
    return (
        <mesh ref={myMesh}>
            <boxBufferGeometry />
            <meshStandardMaterial>
                <videoTexture attach={'map'} args={[video]} />
            </meshStandardMaterial>
        </mesh>
    );

}
// make a simple button 






const App = () => {
    var localVideoTracks = useGlobalState('localVideoTrackID')[0];
    var remoteVideoTracks = useGlobalState('remoteVideoTrackID')[0];
    var localAudioTracks = useGlobalState('localAudioTrackID')[0];
    var remoteAudioTracks = useGlobalState('remoteAudioTrackID')[0];
    const [numtracks, setNumtracks] = useState(0);
    // map all localVideoTracks to div ids



    function roomlistener2(track) {
        setNumtracks(numtracks + 1);
        console.log("track added", track);
        console.log("localVideoTrack value ", localVideoTracks);
        console.log("remoteVideoTrack value ", remoteVideoTracks);
        console.log("localAudioTrack value", localAudioTracks);
        console.log("remoteAudioTrack value", remoteAudioTracks);

    }
    function testingvideofeed() {
        console.log("feeds added", videoIDs);
        if (firstsetting) {
            setinitialpermissions(!initialpermissions);
        }
    }
    useEffect(() => {
        console.log("use effect");
    }, [numtracks]);


    const { jitsi, room, islocalVideoloaded, localtracks, remotetracks } = useJitsiMeetJS();
    const [initialpermissions, setinitialpermissions] = useState(false);
    const [firstsetting, setfirstsetting] = useState(false);

    function MyButton(props) {
        const [state, setState] = useState(false);
        const handleClick = () => {
            console.log("lmao");
            room.sendMessage("hello",'');
            room.room.connection.flush();
            setState(!state);
        }
        return (
            <button onClick={handleClick}>
                {state ? 'ON' : 'OFF'}
            </button>
        );
    }
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(function (stream) {
            if (stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0) {
                console.log("both devices are available")
                setinitialpermissions(true);
                setfirstsetting(true);
            } else {
                console.log("no devices are available")
                setinitialpermissions(false);
                setfirstsetting(true);
            }
        })
        .catch((err) => {
            if (err.name == "NotAllowedError") { console.log("User has denied accessed") }
        });
    // create an array of localvideo ids
    const [videoIDs, setVideoIDs] = useState([]);
    useEffect(() => {
        if (initialpermissions) {
            // push to the videoIDs state array
            console.log("can access camera and stuff")
            setVideoIDs([...videoIDs, {
                value: "localVideo1",

            }])
            console.log("videoIDs changed", videoIDs);
        }
    }, [initialpermissions])


    if (jitsi) {

        window.JitsiMeetJS.mediaDevices.addEventListener(
            window.JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
            testingvideofeed);
    }
    if (room) {

        room.on(window.JitsiMeetJS.events.conference.TRACK_ADDED, roomlistener2);
        room.on(window.JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
            console.log(`track was succefully removed!!!${track}`);
        });
    }
    if (initialpermissions) {
        console.log("initial permissions are true");
        return (
            <>
                <div style={{ width: "100vw", height: "200vh" }}><h1>Jitsi Testing</h1>
                    <h1>testing</h1>
                    <MyButton />
                    <Canvas
                        orthographic camera={{ zoom: 50, position: [0, 0, 10] }}
                    >
                        <VideoTracksLocal arr={localVideoTracks} />
                        <VideoTracksRemote arr={remoteVideoTracks} />
                        <ambientLight intensity={0.1} />
                        <directionalLight />
                    </Canvas>
                </div>
            </>
        );
    }
    else {
        console.log("initial permissions are false");
        return (
            <div>
                <h1>Need Camera and audio permissions</h1>
            </div>
        )
    }




};

export default App;
