navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var  audio_context
  , recorder
  , input
  , start
  , stop
  , recordingslist
;

    
document.addEventListener("DOMContentLoaded", function() {
  start = document.getElementById('start');
  stop = document.getElementById('stop');
  recordingslist = document.getElementById('recordingslist');
  audio_context = new AudioContext;
  navigator.getUserMedia({audio: true}, function(audioStream) {
      input = audio_context.createMediaStreamSource(audioStream);
      start.removeAttribute('disabled');
  }, function(e){ console.log('error occoured= '+e)});

  start.setAttribute('disabled',true);
  stop.setAttribute('disabled',true);
  start.onclick = startRecording;
  stop.onclick = stopRecording;
});


  function startRecording() {
    recorder = new Recorder(input);
    recorder.record();
    start.setAttribute('disabled',true);
    stop.removeAttribute('disabled');
  }

  function stopRecording() {
    start.removeAttribute('disabled');
    stop.setAttribute('disabled',true);    
	recorder.stop(stopCallback);
  }
  
  function stopCallback(blob) {
          var url = URL.createObjectURL(blob);
          var li = document.createElement('li');
          var au = document.createElement('audio');
          var hf = document.createElement('a');
          
          au.controls = true;
          au.src = url;
          hf.href = url;
          hf.download = new Date().toISOString() + '.mp3';
          hf.innerHTML = hf.download;
          li.appendChild(au);
          li.appendChild(hf);
          recordingslist.appendChild(li);   
    }
