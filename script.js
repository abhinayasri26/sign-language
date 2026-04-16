const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const resultText = document.getElementById("result");
let lastGesture = "";
let lastAcceptedGesture = "";
let lastAcceptedTime = 0;
let gestureCount = 0;
let currentGesture = "";

function isFingerUp(tip, pip, landmarks) {
  return landmarks[tip].y < landmarks[pip].y;
}

function detectGesture(landmarks) {
  const thumbUp = landmarks[4].x < landmarks[3].x;
  const indexUp = isFingerUp(8, 6, landmarks);
  const middleUp = isFingerUp(12, 10, landmarks);
  const ringUp = isFingerUp(16, 14, landmarks);
  const pinkyUp = isFingerUp(20, 18, landmarks);

  const thumbIndexDistance = Math.sqrt(
    Math.pow(landmarks[4].x - landmarks[8].x, 2) +
    Math.pow(landmarks[4].y - landmarks[8].y, 2)
  );

  // Hello / open hand
  if (indexUp && middleUp && ringUp && pinkyUp && !thumbUp) return "Hello / Hi ✋";

  // Stop / open palm + thumb out
  if (thumbUp && indexUp && middleUp && ringUp && pinkyUp) return "Stop ✋";

  // Yes / thumbs up
  if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) return "Yes 👍";

  // No / fist
  if (!thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) return "No ✊";

  // Help / point
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Help 👉";

  // Wait / two fingers pause
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "Wait ✋";

  // Come / wave style demo
  if (thumbUp && indexUp && middleUp && !ringUp && !pinkyUp) return "Come 👋";

  // Go / point with thumb
  if (thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) return "Go 👉";

  // Eat / fingers pinch
  if (thumbIndexDistance < 0.05 && middleUp && !ringUp) return "Eat 🤏";

  // Drink / pinky only
  if (!indexUp && !middleUp && !ringUp && pinkyUp) return "Drink 🤙";

  // Good / thumbs up alt
  if (thumbUp && ringUp && pinkyUp && !indexUp && !middleUp) return "Good 👍";

  // Bad / thumb down approx
  if (!thumbUp && indexUp && middleUp && ringUp && pinkyUp) return "Bad 👎";

  // Happy / open relaxed hand
  if (thumbUp && middleUp && ringUp && !indexUp && pinkyUp) return "Happy 🙂";

  // Sad / folded middle three
  if (!thumbUp && !indexUp && middleUp && !ringUp && !pinkyUp) return "Sad ☹️";

  return "Unknown";
}

function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  window.speechSynthesis.speak(speech);
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 1 });

      const gesture = detectGesture(landmarks);

      if (gesture === currentGesture) {
        gestureCount++;
      } else {
        currentGesture = gesture;
        gestureCount = 1;
      }

      if (gestureCount > 15 && gesture !== "Unknown") {
        const now = Date.now();

        if (gesture !== lastAcceptedGesture || now - lastAcceptedTime > 3000) {
          resultText.innerText = "Gesture: " + gesture;
          lastAcceptedGesture = gesture;
          lastAcceptedTime = now;
        }
      }
    }
  } else {
    resultText.innerText = "Gesture: No Hand Detected";
  }
});

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});

camera.start();

function enterApp() {
  const name = document.getElementById("userName").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("mainApp").style.display = "block";
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Mee browser speech recognition support cheyyadu");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = function (event) {
    const text = event.results[0][0].transcript;
    document.getElementById("speechText").innerText = text;
    showSign(text);
  };
}

function showSign(text) {
  const signOutput = document.getElementById("signOutput");
  const t = text.toLowerCase();

  if (t.includes("hello") || t.includes("hallo")) {
    signOutput.innerText = "👋";
  } else if (t.includes("water")) {
    signOutput.innerText = "💧";
  } else if (t.includes("help")) {
    signOutput.innerText = "🆘";
  } else if (t.includes("yes")) {
    signOutput.innerText = "👍";
  } else if (t.includes("no")) {
    signOutput.innerText = "✊";
  } else {
    signOutput.innerText = "🤟";
  }
}