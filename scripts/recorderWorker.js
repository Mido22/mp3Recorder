
  var WORKER_PATH = 'encoder.js';


var recLength = 0,
  recBuffersL = [],
  recBuffersR = [],
  sampleRate,
  encodingInProgress=false,
  recBuffersLTemp = [],       
  recBuffersRTemp = [],      
  recLengthTemp = 0,
  encoder;    
  

this.onmessage = function(e){
  switch(e.data.command){
    case 'init':
      init(e.data.config);
      break;
    case 'record':
      record(e.data.buffer);
      break;
    case 'exportWAV':
      exportWAV(e.data.type);
      break;
    case 'exportMP3':
      exportMP3();
      break;
    case 'getBuffer':
      getBuffer();
      break;
    case 'clear':
      clear();
      break;
    case 'clearAll':
      clearAll();
      break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
  encoder = new Worker(WORKER_PATH);
  encoder.postMessage({
      cmd: 'init',
      config: {
        samplerate: sampleRate
      }
    });
}

function record(inputBuffer){
    if(encodingInProgress){
        recBuffersLTemp.push(inputBuffer[0]);
        recBuffersRTemp.push(inputBuffer[1]);
        recLengthTemp += inputBuffer[0].length;        
    }else{
        recBuffersL.push(inputBuffer[0]);
        recBuffersR.push(inputBuffer[1]);
        recLength += inputBuffer[0].length;
    }
}

function exportWAV(type){
  encodingInProgress=true;
  var bufferL = mergeBuffers(recBuffersL, recLength);
  var bufferR = mergeBuffers(recBuffersR, recLength);
  var interleaved = interleave(bufferL, bufferR);
  var dataview = encodeWAV(interleaved);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage(audioBlob);
}

var self=this;
function exportMP3(){
  encodingInProgress=true;
  var bufferL = mergeBuffers(recBuffersL, recLength);
  var bufferR = mergeBuffers(recBuffersR, recLength);
  console.log('encoding');
encoder.onmessage = function(e){
  switch(e.data.cmd){
    case 'data' : encoder.postMessage({        cmd: 'finish'      });console.log('data');break;
    case 'end' :  console.log('end');
                  var audioBlob = new Blob([new Uint8Array(e.data.buf)], { type: 'audio/mp3' });
                  self.postMessage(audioBlob);
                  break;
  }  
}
      encoder.postMessage({
        cmd: 'encode',
        rbuf: bufferL,
        lbuf: bufferR
      });

      
}


function getBuffer() {
  var buffers = [];
  buffers.push( mergeBuffers(recBuffersL, recLength) );
  buffers.push( mergeBuffers(recBuffersR, recLength) );
  this.postMessage(buffers);
}

function clear(){
  recLength = recLengthTemp;
  recBuffersL = recBuffersLTemp;
  recBuffersR = recBuffersRTemp;
  recLengthTemp = 0;
  recBuffersLTemp = [];
  recBuffersRTemp = [];
  encodingInProgress=false;
}

function clearAll(){
  encodingInProgress=false;
  recLengthTemp = 0;
  recBuffersLTemp = [];
  recBuffersRTemp = [];
  recLength = recLengthTemp;
  recBuffersL = recBuffersLTemp;
  recBuffersR = recBuffersRTemp;
}

function mergeBuffers(recBuffers, recLength){
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffers.length; i++){
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  return result;
}

function interleave(inputL, inputR){
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0,
    inputIndex = 0;

  while (index < length){
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples){
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}
