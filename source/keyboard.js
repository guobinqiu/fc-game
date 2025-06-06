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

// Keyboard events are bound in the UI
JSNES.Keyboard = function () {
  // 检测是否为移动设备
  this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 统一使用单个状态数组
  this.state = new Array(8);
  this.resetState();

  // 绑定键盘事件
  var self = this;
  document.addEventListener('keydown', function (evt) {
    try {
      if (!self.shouldHandleKeyEvent(evt)) {
        return;
      }
      self.keyDown(evt);
    } catch (e) {
      console.error('键盘事件处理错误:', e);
    }
  });
  document.addEventListener('keyup', function (evt) {
    try {
      if (!self.shouldHandleKeyEvent(evt)) {
        return;
      }
      self.keyUp(evt);
    } catch (e) {
      console.error('键盘事件处理错误:', e);
    }
  });
};

JSNES.Keyboard.prototype = {
  // 重置按键状态
  resetState: function () {
    for (var i = 0; i < 8; i++) {
      this.state[i] = 0x40;
    }
  },

  // 检查是否应该处理键盘事件
  shouldHandleKeyEvent: function(evt) {
    // 如果是移动设备的模拟事件，始终处理
    if (evt.isTrusted === false) {
      return true;
    }
    // 检查事件是否来自输入框
    if (evt.target.tagName === 'INPUT' || evt.target.tagName === 'TEXTAREA') {
      return false;
    }
    // 检查是否按下了控制键
    if (evt.ctrlKey || evt.altKey || evt.metaKey) {
      return false;
    }
    return true;
  },

  // 按键映射表
  keyCodeMap: {
    38: 4, // Up
    40: 5, // Down
    37: 6, // Left
    39: 7, // Right
    90: 0, // Z (PC端 B)
    88: 1, // X (PC端 A)
    65: 0, // A (手机端 B)
    66: 1, // B (手机端 A)
    17: 2, // Control (Select)
    13: 3  // Enter (Start)
  },

  keyDown: function (evt) {
    var key = evt.keyCode;
    if (key in this.keyCodeMap) {
      this.state[this.keyCodeMap[key]] = 0x41;
      evt.preventDefault();
    }
  },

  keyUp: function (evt) {
    var key = evt.keyCode;
    if (key in this.keyCodeMap) {
      this.state[this.keyCodeMap[key]] = 0x40;
      evt.preventDefault();
    }
  }
};
