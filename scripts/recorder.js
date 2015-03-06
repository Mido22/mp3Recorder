(function(window){

  var WORKER_PATH = 'scripts/recorderWorker.js';

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = 16384;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                                                         bufferLen, 2, 2);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
          e.inputBuffer.getChannelData(1)
        ]
      });
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(cb){
      currCallback = cb || config.callback;
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportMP3'
      });
      recording = false;
    }
	
    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
	  worker.terminate();
    }

    source.connect(this.node);
  };

  window.Recorder = Recorder;

})(window);
