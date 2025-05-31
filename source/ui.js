/*
JSNES, based on Jamie Sanders' vNES
Copyright (C) 2010 Ben Firshman

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

JSNES.DummyUI = function(nes) {
    this.nes = nes;
    this.enable = function() {};
    this.updateStatus = function() {};
    this.writeAudio = function() {};
    this.writeFrame = function() {};
};

if (typeof jQuery !== 'undefined') {
    (function($) {
        $.fn.JSNESUI = function(roms) {
            var parent = this;
            var UI = function(nes) {
                var self = this;
                self.nes = nes;
                
                /*
                 * Create UI
                 */
                self.root = $('<div></div>');
                self.screen = $('<canvas class="nes-screen" width="960" height="720"></canvas>').appendTo(self.root);
                
                if (!self.screen[0].getContext) {
                    parent.html("Your browser doesn't support the <code>&lt;canvas&gt;</code> tag. Try Google Chrome, Safari, Opera or Firefox!");
                    return;
                }
                
                self.romContainer = $('<div class="nes-roms"></div>').appendTo(self.root);
                self.romSelect = $('#rom-select');
                
                self.buttons = {
                    pause: $('#btn-pause'),
                    restart: $('#btn-restart'),
                    sound: $('#btn-sound')
                };
                
                // 默认开启声音
                self.nes.opts.emulateSound = true;
                
                self.root.appendTo(parent);
                
                /*
                 * ROM loading
                 */
                self.romSelect.change(function() {
                    self.loadROM();
                });
                
                /*
                 * Buttons
                 */
                self.buttons.pause.click(function() {
                    if (self.nes.isRunning) {
                        self.nes.stop();
                        self.updateStatus("Paused");
                        self.buttons.pause.find('use').attr('href', '#icon-play');
                    }
                    else {
                        self.nes.start();
                        self.buttons.pause.find('use').attr('href', '#icon-pause');
                    }
                });
                
                self.buttons.restart.click(function() {
                    self.nes.reloadRom();
                    self.nes.start();
                    self.buttons.pause.find('use').attr('href', '#icon-pause');
                });
                
                self.buttons.sound.click(function() {
                    if (self.nes.opts.emulateSound) {
                        self.nes.opts.emulateSound = false;
                        self.buttons.sound.find('use').attr('href', '#icon-volume-xmark');
                    }
                    else {
                        self.nes.opts.emulateSound = true;
                        self.buttons.sound.find('use').attr('href', '#icon-volume-high');
                    }
                });

                /*
                 * Keyboard
                 */
                $(document).
                bind('keydown', function(evt) {
                    self.nes.keyboard.keyDown(evt);
                }).
                bind('keyup', function(evt) {
                    self.nes.keyboard.keyUp(evt);
                }).
                bind('keypress', function(evt) {
                    self.nes.keyboard.keyPress(evt);
                });
                
                /*
                 * Sound
                 */
                window.AudioContext = window.webkitAudioContext || window.AudioContext;
                try {
                    self.audio = new AudioContext();
                }
                catch(e) {
                    console.error(e);
                    self.dynamicaudio = new DynamicAudio({
                        swf: nes.opts.swfPath+'dynamicaudio.swf'
                    });
                }
                
                /*
                 * Canvas
                 */
                self.canvasContext = self.screen[0].getContext('2d');
                self.canvasContext.fillStyle = 'black';
                self.canvasContext.fillRect(0, 0, 960, 720);
                self.canvasImageData = self.canvasContext.createImageData(960, 720);
                
                if (!self.canvasContext.getImageData) {
                    parent.html("Your browser doesn't support writing pixels directly to the <code>&lt;canvas&gt;</code> tag. Try the latest versions of Google Chrome, Safari, Opera or Firefox!");
                    return;
                }
                
                self.resetCanvas();

                // Initialize frame buffer
                self.frameBuffer = new Array(256 * 240);
                self.prevBuffer = new Array(256 * 240);
                for (var i = 0; i < 256 * 240; i++) {
                    self.frameBuffer[i] = 0;
                    self.prevBuffer[i] = 0;
                }
                
                /*
                 * Set up interval for screen updates
                 */
                self.frameInterval = setInterval(function() {
                    self.writeFrame();
                }, 1000/60);
                
                if (typeof roms != 'undefined') {
                    self.setRoms(roms);
                }

                // 设置移动端控制器
                if (typeof setupMobileControls === 'function') {
                    setupMobileControls();
                }
            };
            
            UI.prototype = {
                loadROM: function() {
                    var self = this;
                    self.updateStatus("Downloading...");
                    $.ajax({
                        url: escape(self.romSelect.val()),
                        xhr: function() {
                            var xhr = $.ajaxSettings.xhr();
                            if (typeof xhr.overrideMimeType !== 'undefined') {
                                // Download as binary
                                xhr.overrideMimeType('text/plain; charset=x-user-defined');
                            }
                            self.xhr = xhr;
                            return xhr;
                        },
                        complete: function(xhr, status) {
                            var i, data;
                            if (JSNES.Utils.isIE()) {
                                var charCodes = JSNESBinaryToArray(
                                    xhr.responseBody
                                ).toArray();
                                data = String.fromCharCode.apply(
                                    undefined,
                                    charCodes
                                );
                            }
                            else {
                                data = xhr.responseText;
                            }
                            self.nes.loadRom(data);
                            self.nes.start();
                            self.enable();
                        }
                    });
                },
                
                resetCanvas: function() {
                    this.canvasContext.fillStyle = 'black';
                    this.canvasContext.fillRect(0, 0, 960, 720);
                    
                    // Set alpha
                    for (var i = 3; i < this.canvasImageData.data.length-3; i += 4) {
                        this.canvasImageData.data[i] = 0xFF;
                    }
                },
                
                enable: function() {
                    this.buttons.pause.attr("disabled", null);
                    if (this.nes.isRunning) {
                        this.buttons.pause.find('use').attr('href', '#icon-pause');
                    }
                    else {
                        this.buttons.pause.find('use').attr('href', '#icon-play');
                    }
                    this.buttons.restart.attr("disabled", null);
                    this.buttons.sound.attr("disabled", null);
                    if (this.nes.opts.emulateSound) {
                        this.buttons.sound.find('use').attr('href', '#icon-volume-high');
                    }
                    else {
                        this.buttons.sound.find('use').attr('href', '#icon-volume-xmark');
                    }
                },
                
                updateStatus: function(s) {
                    // TODO: Show status somewhere
                    console.log(s);
                },

                setRoms: function(roms) {
                    this.romSelect.children().remove();
                    $("<option>选择游戏...</option>").appendTo(this.romSelect);
                    for (var groupName in roms) {
                        if (roms.hasOwnProperty(groupName)) {
                            var optgroup = $('<optgroup></optgroup>').
                                attr("label", groupName);
                            for (var i = 0; i < roms[groupName].length; i++) {
                                $('<option>' + roms[groupName][i][0] + '</option>')
                                    .attr("value", roms[groupName][i][1])
                                    .appendTo(optgroup);
                            }
                            this.romSelect.append(optgroup);
                        }
                    }
                },

                writeAudio: function(samples) {
                    if (this.dynamicaudio) {
                        return this.dynamicaudio.writeInt(samples);
                    }
                    
                    var buffer = this.audio.createBuffer(2, samples.length, this.audio.sampleRate);
                    var channelLeft = buffer.getChannelData(0);
                    var channelRight = buffer.getChannelData(1);
                    var j = 0;
                    for (var i = 0; i < samples.length; i += 2) {
                        channelLeft[j] = this.intToFloatSample(samples[i]);
                        channelRight[j] = this.intToFloatSample(samples[i + 1]);
                        j++;
                    }
                    var source = this.audio.createBufferSource();
                    source.buffer = buffer;
                    source.connect(this.audio.destination);
                    source.start();
                },
                
                intToFloatSample: function(value) {
                    return value / 32767;
                },

                writeFrame: function() {
                    // Get the frame data from the emulator
                    var buffer = this.nes.ppu.buffer;
                    var prevBuffer = this.prevBuffer;
                    
                    // Render the frame
                    var imageData = this.canvasImageData.data;
                    var pixel, i, j;
                    var scaleX = 3.75;  // Scale X to maintain 4:3 aspect ratio
                    var scaleY = 3;     // Scale Y by 3
                    var width = Math.floor(256 * scaleX);
                    var height = 240 * scaleY;

                    for (var y = 0; y < 240; y++) {
                        for (var x = 0; x < 256; x++) {
                            i = (y * 256 + x);
                            pixel = buffer[i];

                            if (pixel != prevBuffer[i]) {
                                var r = pixel & 0xFF;
                                var g = (pixel >> 8) & 0xFF;
                                var b = (pixel >> 16) & 0xFF;

                                // Scale each pixel to maintain 4:3 aspect ratio
                                for (var dy = 0; dy < scaleY; dy++) {
                                    for (var dx = 0; dx < scaleX; dx++) {
                                        j = (Math.floor(y * scaleY + dy) * width + Math.floor(x * scaleX + dx)) * 4;
                                        imageData[j] = r;
                                        imageData[j + 1] = g;
                                        imageData[j + 2] = b;
                                        imageData[j + 3] = 0xFF;
                                    }
                                }
                                prevBuffer[i] = pixel;
                            }
                        }
                    }

                    this.canvasContext.putImageData(this.canvasImageData, 0, 0);
                }
            };
            
            return UI;
        };
    })(jQuery);
}