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
JSNES.Keyboard = function() {
    var i;
    
    this.keys = {
        KEY_B: 0,
        KEY_A: 1,
        KEY_SELECT: 2,
        KEY_START: 3,
        KEY_UP: 4,
        KEY_DOWN: 5,
        KEY_LEFT: 6,
        KEY_RIGHT: 7
    };

    this.state1 = new Array(8);
    for (i = 0; i < this.state1.length; i++) {
        this.state1[i] = 0x40;
    }
    this.state2 = new Array(8);
    for (i = 0; i < this.state2.length; i++) {
        this.state2[i] = 0x40;
    }
};

JSNES.Keyboard.prototype = {
    setKey: function(key, value) {
        switch (key) {
            // Player1 - 主要控制
            case 38: this.state1[this.keys.KEY_UP] = value; break;     // UP: Arrow Up(38)
            case 40: this.state1[this.keys.KEY_DOWN] = value; break;   // DOWN: Arrow Down(40)
            case 37: this.state1[this.keys.KEY_LEFT] = value; break;   // LEFT: Arrow Left(37)
            case 39: this.state1[this.keys.KEY_RIGHT] = value; break;  // RIGHT: Arrow Right(39)
            case 88: this.state1[this.keys.KEY_B] = value; break;      // B: X(88)
            case 90: this.state1[this.keys.KEY_A] = value; break;      // A: Z(90)
            case 17: this.state1[this.keys.KEY_SELECT] = value; break; // SELECT: Ctrl(17)
            case 13: this.state1[this.keys.KEY_START] = value; break;  // START: Enter(13)
            // Player2 - 仅方向和AB键
            case 87: this.state2[this.keys.KEY_UP] = value; break;     // Up: W(87)
            case 83: this.state2[this.keys.KEY_DOWN] = value; break;   // Down: S(83)
            case 65: this.state2[this.keys.KEY_LEFT] = value; break;   // Left: A(65)
            case 68: this.state2[this.keys.KEY_RIGHT] = value; break;  // Right: D(68)
            case 75: this.state2[this.keys.KEY_B] = value; break;      // B: K(75)
            case 74: this.state2[this.keys.KEY_A] = value; break;      // A: J(74)
            default: return true;
        }
        return false; // preventDefault
    },

    keyDown: function(evt) {
        if (!this.setKey(evt.keyCode, 0x41) && evt.preventDefault) {
            evt.preventDefault();
        }
    },
    
    keyUp: function(evt) {
        if (!this.setKey(evt.keyCode, 0x40) && evt.preventDefault) {
            evt.preventDefault();
        }
    },
    
    keyPress: function(evt) {
        evt.preventDefault();
    }
};
