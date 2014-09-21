navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var  audio_context
  , recorder
  , input
;
$(document).ready(function() {
  audio_context = new AudioContext;
  navigator.getUserMedia({audio: true}, function(audioStream) {
      input = audio_context.createMediaStreamSource(audioStream);
      input.connect(audio_context.destination);
      $('#start').attr('disabled',false);
  }, function(e){ console.log('error occoured= '+e)});

  $('#start').attr('disabled',true);
  $('#stop').attr('disabled',true);
  $('#start').click(startRecording);
  $('#stop').click(stopRecording);

});


  function startRecording() {
    recorder = new Recorder(input);
    recorder.record();
    $('#start').attr('disabled',true);
    $('#stop').attr('disabled',false);
  }

  function stopRecording() {
    recorder.stop();
    $('#start').attr('disabled',false);
    $('#stop').attr('disabled',true);    
    createDownloadLink(); 
  }



  function createDownloadLink() {
      recorder.exportMP3(function(blob) {
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
      recorder.clearAll();
    });
  }


function log(e, data) {
    $('#log').html($('#log').html() + "\n" + e + " " + (data || ''));
    console.log('msg='+e);
}