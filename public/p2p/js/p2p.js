
let localVideo,remoteVideo,callBtn,handupBtn; //dom
let localStream,remoteStream;
let peerConnection; //webrtc

// const configuration = {
//     iceServers: [{
//         urls: 'stun:stun.l.google.com:19302'
//     }]
// };
const configuration = null;
const offerOptions = { offerToReceiveVideo: true,offerToReceiveAudio: true }
//signalling sever
const socket = io()
socket.on('candidate',msg => {
    console.log(`Socket：Receive candidate msg`)
    let data = JSON.parse(msg)
    if(data.type == 'candidate'){
        initPeerConnection()
        peerConnection.addIceCandidate(new RTCIceCandidate(data.message))
            .then(handleAddIceCandidateSuccess).catch(handleAddIceCandidateError);
    }
})
socket.on('sdp',msg => {
    console.log(`Socket：Receive sdp msg`)
    let data = JSON.parse(msg)
    let desc = data.message;
    if(peerConnection){
        peerConnection.setRemoteDescription(desc)
            .then(setSessionDescriptionSuccess).catch(setSessionDescriptionError);
    }else{
        answer().then( () => {
            peerConnection.setRemoteDescription(desc)
             .then(setSessionDescriptionSuccess).catch(setSessionDescriptionError);
            peerConnection.createAnswer()
                .then((description) => {
                    peerConnection.setLocalDescription(description)
                    sendMessage('sdp',{type:'sdp',message: description})
                }).catch(setSessionDescriptionError);
        });
        
    }

})
function sendMessage(type,data){
    console.log(`Socket：Send ${type} message to signalling server`)
    socket.emit(type, JSON.stringify(data));
}


function handleAddIceCandidateSuccess(){
    console.log(`Add ic candidate success`)
}
function handleAddIceCandidateError(err){
    console.error(`Add ice candidate error : ${err.toString()}`)
}

function setSessionDescriptionSuccess(){
    console.log('Set session description success')
}
function setSessionDescriptionError(err){
    console.error(`Set session description error : ${err.toString()}`)
}

function makeCall(){
    navigator.mediaDevices.getUserMedia({video:true,audio:true}).then (mediaStream => {
        localVideo.srcObject = mediaStream
        localStream = mediaStream
        //init peerconnection
        initPeerConnection()
        peerConnection.addStream(mediaStream)
        
        peerConnection.createOffer(offerOptions).then( description=>{
            peerConnection.setLocalDescription(description) 
                .then(setSessionDescriptionSuccess).catch(setSessionDescriptionError);
            sendMessage('sdp',{type: 'sdp',message: description})
        }).catch(setSessionDescriptionError); 
    }).catch(err => {
        console.log(`getUserMedia error : ${err.toString()}`)
    })
}

function answer(){
    initPeerConnection()
    return new Promise( (resolve,reject) => {
        navigator.mediaDevices.getUserMedia({video:true,audio:true}).then (mediaStream => {
            localVideo.srcObject = mediaStream
            localStream = mediaStream
            peerConnection.addStream(mediaStream)
            resolve()
        }).catch(err => {
            console.log(`getUserMedia error : ${err.toString()}`)
            reject()
        })
    })
}

function handup(){
  peerConnection.close()
  localStream && (localStream.getTracks()[0].stop())
  remoteStream &&　(remoteStream.getTracks()[0].stop())

}


function initPeerConnection(){
    if(peerConnection){
        return
    }
    peerConnection = new RTCPeerConnection(configuration)
    peerConnection.addEventListener('icecandidate', event => {
        const candidate = event.candidate;
        if(candidate){ 
            sendMessage('candidate',{ type: 'candidate', message: candidate})
        }
    }); //ice
    peerConnection.onaddstream = ev => {
        remoteVideo.srcObject = ev.stream
        remoteStream = ev.stream;
    }
    peerConnection.onremovestream = ev => {
        remoteVideo.srcObject = null;
    }
}


window.onload = function(){
    localVideo = document.getElementById('localVideo')
    remoteVideo = document.getElementById('remoteVideo')
    callBtn = document.getElementById('callBtn')
    handupBtn = this.document.getElementById('handupBtn')

    callBtn.addEventListener('click',function(){
        makeCall()
    })
    handupBtn.addEventListener('click',() => {
        handup()
    })
   
}