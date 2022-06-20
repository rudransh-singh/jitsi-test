import { createGlobalState } from "react-hooks-global-state";

const {setGlobalState, useGlobalState} = createGlobalState({
    localVideoTrackID: [],
    remoteVideoTrackID: [],
    localAudioTrackID: [],
    remoteAudioTrackID: [],
})

export { useGlobalState, setGlobalState };