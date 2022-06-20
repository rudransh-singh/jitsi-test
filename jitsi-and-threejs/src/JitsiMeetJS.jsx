import { useState, useEffect } from 'react';
import propTypes from 'prop-types';
import $ from 'jquery';
import { useGlobalState, setGlobalState } from './globalStates';

const useJitsiMeetJS = (props) => {
    const [error, setError] = useState(null)
    const [jitsi, setJitsi] = useState(null)
    const [room, setRoom] = useState(null)
    const [islocalVideoloaded, setIsLocalVideoLoaded] = useState(false)
    const [localtracks, setLocalTracks] = useState(null)
    const [remotetracks, setRemoteTracks] = useState(null)
    var localVideoTracks = useGlobalState('localVideoTrackID')[0];
    var remoteVideoTracks = useGlobalState('remoteVideoTrackID')[0];
    var localAudioTracks = useGlobalState('localAudioTrackID')[0];
    var remoteAudioTracks = useGlobalState('remoteAudioTrackID')[0];
    useEffect(() => {
        if (window.JitsiMeetJS) {
            console.log("Jitsi Meet is loading")
        }
        else {
            setError('JitsiMeetExternalAPI is not available, check if https://meet.jit.si/external_api.js was loaded')
            return;
        }
        const options = {
            hosts: {
                domain: 'meet.jit.si',
                muc: 'conference.meet.jit.si'
            },
            serviceUrl:'wss://meet.jit.si/xmpp-websocket?room=testing123',
            deploymentInfo: {
                environment: 'meet-jit-si',
                envType: 'prod',
                releaseNumber: '2977',
                shard: 'meet-jit-si-ap-mumbai-1-s31',
                region: 'ap-south-1',
                userRegion: 'ap-south-1',
                crossRegion: (!'ap-south-1' || 'ap-south-1' === 'ap-south-1') ? 0 : 1
            },
            p2p: {
                enabled: false,
            }

        };

        const confOptions = {
        };

        let localTracks = [];
        let remoteTracks = [];
        let isJoined = false;
        let connection = null;
        /**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
        function onLocalTracks(tracks) {
            console.log("tracks is",tracks.length)
            console.log(tracks)
            localTracks = tracks;
            for (let i = 0; i < localTracks.length; i++) {
                localTracks[i].addEventListener(
                    window.JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
                    audioLevel => console.log(`Audio Level local: ${audioLevel}`));
                localTracks[i].addEventListener(
                    window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                    () => console.log('local track muted'));
                localTracks[i].addEventListener(
                    window.JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                    () => console.log('local track stoped'));
                localTracks[i].addEventListener(
                    window.JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
                    deviceId =>
                        console.log(
                            `track audio output device was changed to ${deviceId}`));
                if (localTracks[i].getType() === 'video') {
                    $('#root').append(`<div style="visibility: hidden; display:inline;" >id='localVideo${i}div'><video autoplay='1' id='localVideo${i}'></video></div>`);
                    localTracks[i].attach($(`#localVideo${i}`)[0]);
                    localVideoTracks.push(localTracks[i]);
                    setGlobalState("localVideoTrackID", localVideoTracks );
                    console.log("localVideoTracks is",localVideoTracks)
                } else {
                    $('#root').append(
                        `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
                    localTracks[i].attach($(`#localAudio${i}`)[0]);
                    localAudioTracks.push(localTracks[i]);
                    setGlobalState( "localAudioTrackID", localAudioTracks );
                    console.log("localAudioTracks is",localAudioTracks)
                    
                }
                if (isJoined) {
                    room.addTrack(localTracks[i]);
                }
            }
            setIsLocalVideoLoaded(true);
            setLocalTracks(localTracks);
        }

        function onRemoteTrack(trackrem) {
            console.log("inside remote track function")
            console.log("trackis")
            console.log(trackrem)
            console.log("done")
            if (trackrem.isLocal()) {
                return;
            }
            const participant = trackrem.getParticipantId();

            if (!remoteTracks[participant]) {
                remoteTracks[participant] = [];
            }
            const idx = remoteTracks[participant].push(trackrem);

            trackrem.addEventListener(
                window.JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
                audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
            trackrem.addEventListener(
                window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('remote track muted'));
            trackrem.addEventListener(
                window.JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('remote track stoped'));
            trackrem.addEventListener(window.JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
                deviceId =>
                    console.log(
                        `track audio output device was changed to ${deviceId}`));
            const id = participant + trackrem.getType() + idx;

            if (trackrem.getType() === 'video') {
                $('body').append(
                    `<video autoplay='1' id='${participant}video${idx}' />`);
                    remoteVideoTracks.push(trackrem);
                    setGlobalState( "remoteVideoTrackID", remoteVideoTracks );
                    console.log("remoteVideoTracks is",remoteVideoTracks)
            } else {
                $('body').append(
                    `<audio autoplay='1' id='${participant}audio${idx}' />`);
                    remoteAudioTracks.push(trackrem);
                    setGlobalState( "remoteAudioTrackID", remoteAudioTracks );
                    console.log("remoteAudioTracks is",remoteAudioTracks)
                    
            }
            trackrem.attach($(`#${id}`)[0]);
            setRemoteTracks(remoteTracks);
        }
        function onConferenceJoined() {
            console.log('conference joined!');
            isJoined = true;
            for (let i = 0; i < localTracks.length; i++) {
                room.addTrack(localTracks[i]);
            }
        }
        function onUserLeft(id) {
            console.log('user left');
            if (!remoteTracks[id]) {
                return;
            }
            const tracks = remoteTracks[id];

            for (let i = 0; i < tracks.length; i++) {
                tracks[i].detach($(`#${id}${tracks[i].getType()}`));
            }
        }
        function ireceivedmessage()
        {
            console.log("message was received")
        }

        function onConnectionSuccess() {
            console.log("connection established");
            room = connection.initJitsiConference('testing123', confOptions);
            console.log("created room")
            setRoom(room)
            // connected to conference
            console.log("connected to conference")
            room.on(window.JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
            console.log("added track listener")
            room.on(window.JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
                console.log(`track removed!!!${track}`);
            });
            room.on(
                window.JitsiMeetJS.events.conference.MESSAGE_RECEIVED, ireceivedmessage);
            room.sendMessage("hello");
            room.room.connection.flush();
            room.on(window.JitsiMeetJS.events.conference.CONFERENCE_JOINED,
                onConferenceJoined);
            room.on(window.JitsiMeetJS.events.conference.USER_JOINED, id => {
                console.log('user join');
                remoteTracks[id] = [];
            });
            room.on(window.JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
            room.on(window.JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
                console.log("feed changed")
                console.log(`${track.getType()} - ${track.isMuted()}`);
            });
            room.on(window.JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
                (userID, displayName) => console.log(`${userID} - ${displayName}`));
            room.on(window.JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
                (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
            room.on(window.JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
                () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
            room.join();
        }
        function onConnectionFailed() {
            console.error('Connection Failed!');
        }
        function onDeviceListChanged(devices) {
            console.info('current devices', devices);
        }
        function disconnect() {
            console.log('disconnect!');
            connection.removeEventListener(
                window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
                onConnectionSuccess);
            connection.removeEventListener(
                window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
                onConnectionFailed);
            connection.removeEventListener(
                window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
                disconnect);
        }
        function unload() {
            for (let i = 0; i < localTracks.length; i++) {
                localTracks[i].dispose();
            }
            room.leave();
            connection.disconnect();
        }
        let isVideo = true;
        function switchVideo() { // eslint-disable-line no-unused-vars
            isVideo = !isVideo;
            if (localTracks[1]) {
                localTracks[1].dispose();
                localTracks.pop();
            }
            window.JitsiMeetJS.createLocalTracks({
                devices: [isVideo ? 'video' : 'desktop']
            })
                .then(tracks => {
                    localTracks.push(tracks[0]);
                    localTracks[1].addEventListener(
                        window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                        () => console.log('local track muted'));
                    localTracks[1].addEventListener(
                        window.JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                        () => console.log('local track stoped'));
                    localTracks[1].attach($('#localVideo1')[0]);
                    room.addTrack(localTracks[1]);
                })
                .catch(error => console.log(error));
        }

        function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
            window.JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
        }
        $(window).on('beforeunload', unload);
        $(window).on('unload', unload);



        console.log(options);

        window.JitsiMeetJS.init();
        console.log("initialiaztion done")

        connection = new window.JitsiMeetJS.JitsiConnection(null, null, options);
        setJitsi(connection);
        connection.addEventListener(
            window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
            onConnectionSuccess);
        connection.addEventListener(
            window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
            onConnectionFailed);
        connection.addEventListener(
            window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
            disconnect);


        console.log("connection done")
        window.JitsiMeetJS.mediaDevices.addEventListener(
            window.JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
            onDeviceListChanged);

        connection.connect();
        console.log("connection connect done")

        window.JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
            .then(onLocalTracks)
            .catch(error => {
                throw error;
            });


        let room = null;
        if (window.JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
            window.JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                const audioOutputDevices
                    = devices.filter(d => d.kind === 'audiooutput');
        
                if (audioOutputDevices.length > 1) {
                    $('#audioOutputSelect').html(
                        audioOutputDevices
                            .map(
                                d =>
                                    `<option value="${d.deviceId}">${d.label}</option>`)
                            .join('\n'));
        
                    $('#audioOutputSelectWrapper').show();
                }
            });
        }
        console.log("room value is", null)
        return () => jitsi;

    }, [window.JitsiMeetJS])
    return {jitsi, room, islocalVideoloaded,localtracks,remotetracks};
}
export default useJitsiMeetJS;