(function () {
  "use strict";
  
  var radioState = "disconnected";
  var usedGamepad;
  
  window.onload = function() {

    init();

    // Run the program
    var getSetPoint = window.setInterval(sendSetpoint, 30);
  };


  function reportVal(obj, stg) {
    document.getElementById(obj.id).onchange = function() {
      document.getElementById(obj.id + "Val").innerText = Math.round(this.value/obj.val*100) + "%";
      stg();
    }
  }


  window.thrust = 0;
  window.timeIndex = 0;
  function sendSetpoint() {
    
    var gamepads = navigator.getGamepads();
    
    // Selecting gamepad
    if (!window.usedGamepad) {
      _(gamepads).each(function (g) {
        if (g) {
          if(g.buttons[0]) {
            for(var i=0; i<g.buttons.length; i++) {
              if(g.buttons[i].pressed) {
                console.log(i);
              }
            }
            if (g.buttons[0].pressed) {
              window.usedGamepad = g.index;
              
              $("#gamepadText").text("Using: " + g.id).addClass("deviceConnected");
              $("#gamepadText").attr("style","");
              $("#home .hidden").removeClass("hidden");
            }
          }
        }
      });
    }

    // Drop out if gamepad is not selected
    if(!window.usedGamepad) return;

    var myGamepad = gamepads[window.usedGamepad];

    // Use a different button layout for Xbox controllers (right trigger is thrust)
    if(myGamepad.id.indexOf("Xbox") != -1) {
      var yawPrimitive = myGamepad.axes[2];
      var pitchPrimitive = myGamepad.axes[1];
      var rollPrimitive = myGamepad.axes[0];
      var thrustPrimitive = myGamepad.axes[3];
    } else {
      // Default to use thumbsticks
      var rollPrimitive = myGamepad.axes[0];
      var pitchPrimitive = myGamepad.axes[1];
      var yawPrimitive = myGamepad.axes[2];
      var thrustPrimitive = myGamepad.axes[3];
    }
    
    var pitch = 0,
        roll  = 0,
        yaw   = 0;

    var factors = {
      pitch:parseFloat(document.getElementById("pitchFactor").value),
      roll:parseFloat(document.getElementById("rollFactor").value),
      yaw:parseFloat(document.getElementById("yawFactor").value),
      thrust:parseFloat(document.getElementById("thrustFactor").value),
      zero: {
        pitch:parseFloat(document.getElementById("pitchFactorZ").value),
        roll:parseFloat(document.getElementById("rollFactorZ").value),
        yaw:parseFloat(document.getElementById("yawFactorZ").value)
      }
    }

    // var pitchFactor = parseFloat(document.getElementById("pitchFactor").value);
    // var rollFactor = parseFloat(document.getElementById("rollFactor").value);
    // var yawFactor = parseFloat(document.getElementById("yawFactor").value);
    // var thrustFactor = parseFloat(document.getElementById("thrustFactor").value);
    
    // Getting values from gamepad
    roll = rollPrimitive * factors.roll;
    pitch = pitchPrimitive * factors.pitch;
    yaw = yawPrimitive * factors.yaw;
    if(!myGamepad.buttons[0].pressed) window.thrust = -thrustPrimitive * factors.thrust;
    //if(!myGamepad.buttons[11].pressed) window.thrust = -thrustPrimitive * factors.thrust/2;

    if(myGamepad.buttons[12].pressed) {
      if(myGamepad.buttons[0].pressed) {
        window.thrust += 50;
      }
    }
    if(myGamepad.buttons[13].pressed) {
      if(myGamepad.buttons[0].pressed) {
        window.thrust -= 50;
      }
    }
    

    // var pitchFactorZ = parseFloat(document.getElementById("pitchFactorZ").value);
    // var rollFactorZ = parseFloat(document.getElementById("rollFactorZ").value);
    // var yawFactorZ = parseFloat(document.getElementById("yawFactorZ").value);
    

    // Set to zero if value is less than specified zero limit
    if (window.thrust < 200) window.thrust = 0;
    if (yawPrimitive*100 < factors.zero.yaw && yawPrimitive*100 > -factors.zero.yaw) { yaw = 0; }
    if (rollPrimitive*100 < factors.zero.roll && rollPrimitive*100 > -factors.zero.roll) roll = 0;
    if (pitchPrimitive*100 < factors.zero.pitch && pitchPrimitive*100 > -factors.zero.pitch) pitch = 0;
  

    // Report values as percentage
    $("#thrust").text(Math.round(thrustPrimitive*100) + "%");
    if(yaw != 0)  $("#yaw").text(Math.round(yawPrimitive*100) + "%");
    if(yaw == 0)  $("#yaw").text("0%");
    if(pitch != 0)  $("#pitch").text(Math.round(pitchPrimitive*100) + "%");
    if(pitch == 0)  $("#pitch").text("0%");
    if(roll != 0)  $("#roll").text(Math.round(rollPrimitive*100) + "%");
    if(roll == 0)  $("#roll").text("0%");
    if(thrust == 0)  $("#thrust").text("0%");

    if(document.getElementById("dataCheck").checked)
      document.getElementById("dataRecord").value += window.timeIndex*30 + "\t" + yaw + "\t" + pitch + "\t" + roll + "\t" + thrust + "\n";
    
    window.timeIndex++;

    //Preparing commander packet
    var packet = new ArrayBuffer(15);
    var dv = new DataView(packet);
    
    dv.setUint8(0, 0x30, true);      // CRTP header
    dv.setFloat32(1, roll, true);    // Roll
    dv.setFloat32(5, pitch, true);   // Pitch
    dv.setFloat32(9, yaw, true);     // Yaw
    dv.setUint16(13, window.thrust, true);  // Thrust
    
    Crazyradio.sendPacket(packet, function(state, data) {
      if (state === true) {
        $("#packetLed").addClass("good");
        $("#packetStatus").text("Connected and Ready");
      } else {
        $("#packetLed").removeClass("good");
        $("#packetStatus").text("Connected but not Ready");
      }
    });
  }



























  
  function init() {
    document.getElementById("dataRecord").value = "Time(ms)\tYaw (-200 to 200)\tPitch (-30 to 30)\tRoll (-30 to 30)\tThrust (0 to 55000)\n";
    window.connectButtonDOM = document.querySelector('#connectButton');
    window.pitchFactorDOM = document.querySelector("#pitchFactor");
    window.rollFactorDOM = document.querySelector("#rollFactor");
    window.yawFactorDOM = document.querySelector("#yawFactor");
    window.thrustFactorDOM = document.querySelector("#thrustFactor");

    // Populate channel options
    postChannelOptions();

    // Get stored options
    postStoredOptions();

    // Add functionality to the connect button
    connectButton();

    // Detect gamepad connection
    detectGamapadConnection();

    // Update last used date/time
    var now = new Date().toLocaleString();
    chrome.storage.sync.set({lastuse:now}, function(){});

    // Post on the screen the sensitivity value
    reportVal({id:"thrustFactor", val:55000}, function() {chrome.storage.sync.set({
      thrustFactor:thrustFactorDOM.value
    }, function() {});});
    reportVal({id:"pitchFactor", val:30}, function() {chrome.storage.sync.set({
      pitchFactor:pitchFactorDOM.value
    }, function() {});});
    reportVal({id:"rollFactor", val:30}, function() {
      chrome.storage.sync.set({rollFactor:rollFactorDOM.value
    }, function() {});});
    reportVal({id:"yawFactor", val:200}, function() {
      chrome.storage.sync.set({yawFactor:yawFactorDOM.value
    }, function() {});});

    // Save percent to zero values everytime they change
    document.getElementById("pitchFactorZ").onchange = function() {
      chrome.storage.sync.set({pitchFactorZ:document.getElementById("pitchFactorZ").value}, function() {});
    }
    document.getElementById("rollFactorZ").onchange = function() {
      chrome.storage.sync.set({rollFactorZ:document.getElementById("rollFactorZ").value}, function() {});
    }
    document.getElementById("yawFactorZ").onchange = function() {
      chrome.storage.sync.set({yawFactorZ:document.getElementById("yawFactorZ").value}, function() {});
    }

    // Save channel and datarate values everytime they change  
    document.getElementById("channel").onchange = function() {
      chrome.storage.sync.set({channel:document.getElementById("channel").value}, function() {});
    }
    document.getElementById("datarate").onchange = function() {
      chrome.storage.sync.set({datarate:document.getElementById("datarate").value}, function() {});
    }
  }




  function postChannelOptions() {
    for(var j=0; j<126; j++) {
      var option = document.createElement("option");
      option.value = j;
      option.innerText = j;
      if(j==2) option.setAttribute("selected","true");
      document.getElementById("channel").appendChild(option);
    }
  }






  function detectGamapadConnection() {
    window.addEventListener("gamepadconnected", function(e) {
      var gp = navigator.getGamepads()[0];
      console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
      gp.index, gp.id,
      gp.buttons.length, gp.axes.length);
    });
  }






  function postStoredOptions() {
    chrome.storage.sync.get({
      rollFactor:     30,
      pitchFactor:    30,
      yawFactor:      200,
      thrustFactor:   55000,
      rollFactorZ:    5,
      pitchFactorZ:   5,
      yawFactorZ:     5,
      channel:        2,
      datarate:       "2Mbps",
      lastuse:        "Never"
    }, function(s){
      // Set sensitivity and percent to zero values based on last use
      document.getElementById("rollFactor").value = s.rollFactor;
      document.getElementById("rollFactorVal").innerText = Math.round(s.rollFactor*100/30) + "%";
      document.getElementById("pitchFactor").value = s.pitchFactor;
      document.getElementById("pitchFactorVal").innerText = Math.round(s.pitchFactor*100/30) + "%";
      document.getElementById("yawFactor").value = s.yawFactor;
      document.getElementById("yawFactorVal").innerText = Math.round(s.yawFactor*100/200) + "%";
      document.getElementById("thrustFactor").value = s.thrustFactor;
      document.getElementById("thrustFactorVal").innerText = Math.round(s.thrustFactor*100/55000) + "%";
      document.getElementById("rollFactorZ").value = s.rollFactorZ;
      document.getElementById("pitchFactorZ").value = s.pitchFactorZ;
      document.getElementById("yawFactorZ").value = s.yawFactorZ;

      // Set channel and datarate based on last use
      document.getElementById("channel").value = s.channel;
      document.getElementById("datarate").value = s.datarate;

      // State time and date of last use
      document.getElementById("lastuse").innerText = "Last Use: " + s.lastuse;
    });
  }






  function connectButton() {
    connectButtonDOM.onclick = function() {
      if (radioState === "disconnected") {
        Crazyradio.open(function(state) {
          console.log("Crazyradio opened: " + state);
          if (state === true) {
            Crazyradio.setChannel($("#channel").val(), function(state) {
              Crazyradio.setDatarate($("#datarate").val(), function(state) {
                if (state) {
                  $("#connectButton").text("Disconnect");
                  $("#packetLed").addClass("connected");
                  $("packetStatus").text("Connected");
                  radioState = "connected";
                  $('#channel').prop('disabled', true);
                  $('#datarate').prop('disabled', true);
                }
              });
            });
          }
        });
      } else if (radioState === "connected") {
        radioState = "disconnected";
        Crazyradio.close();
        
        $("#connectButton").text("Connect Crazyflie");
        $("#packetLed").removeClass("connected");
        $('#channel').prop('disabled', false);
        $('#datarate').prop('disabled', false);
      }
    }
    connectButtonDOM.click();
  }


  $(".tog").click(function() {
    var target = this.getAttribute("data-target");
    $("section").addClass("hidden");
    $(target).removeClass("hidden");
    $(".tog").removeClass("active");
    $(this).addClass("active");
  });
}());