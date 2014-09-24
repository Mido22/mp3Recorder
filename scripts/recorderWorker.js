var WORKER_PATH = 'encoder.js';


var encoder, data=[];    
  

this.onmessage = function(e){
  switch(e.data.command){
    case 'init':
      init(e.data.config);
      break;
    case 'record':
      record(e.data.buffer);
      break;
    case 'exportMP3':
      exportMP3();
      break;
    case 'clear':
      clear();
      break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
  encoder = new Worker(WORKER_PATH);
  encoder.onmessage = function(e){
  switch(e.data.cmd){
    case 'data' : 
            var length = e.data.buf.length;
            for(var i=0;i<length;i++)
              data.push(e.data.buf[i]);
            console.log('data = '+e.data.buf);break;
    case 'end' :    
            var audioBlob = new Blob([new Uint8Array(data)], { type: 'audio/mp3' });
            self.postMessage(audioBlob);
            break;
    }  
  }
  encoder.postMessage({
      cmd: 'init',
      config: {
        samplerate: sampleRate, 
        channels: 2,
    mode: 1, // setting mode as Stereo.
    bitrate: 128
      }
    });
}

function record(inputBuffer){
      encoder.postMessage({
        cmd: 'encode',
        rbuf: inputBuffer[0],
        lbuf: inputBuffer[1]
      });
}

function exportMP3(){
  encoder.postMessage({cmd: 'finish'});      
}

function clear(){
  data=[];
}