  function init() {
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
      thrustFactor:   5500,
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