const feed = new ItemFeed();
const demo = new URLSearchParams(location.search).get("demo") === "1";
let lastHandUpdate = -Infinity;
let stream;
const objectDebug = !demo && new URLSearchParams(location.search).get("diagnostics") === "1";
const byId = id => document.getElementById(id);
const setStatus = (id, message) => { byId(id).textContent = message; };

function renderFeed() {
  const shares = new Map(feed.distribution());
  for (const item of items) {
    const value = feed.unlocked.has(item)
      ? feed.counts[item] + " selected / " + Math.round(100 * shares.get(item)) + "%"
      : "Locked";
    setStatus(item, item + " · " + value);
  }
}

function bindControls() {
  byId("reset").onclick = resetArtwork;
  byId("camera").onclick = enableCamera;
  byId("simulation").hidden = !demo;
  if (objectDebug) {
    byId("object-debug").hidden = false;
    void prepareClassifier().catch(error => reportClassifierError("loading or warm-up", error));
  }
  if (demo) {
    setStatus("model-status", "SIMULATION MODE");
    for (const button of byId("simulation").querySelectorAll("button")) {
      button.onclick = () => {
        for (let i = 0; i < 3; i++) feed.observe(button.dataset.item, 1);
        renderFeed();
      };
    }
  }
  renderFeed();
}

async function enableCamera() {
  const button = byId("camera");
  button.disabled = true;
  setStatus("hand-status", "Opening camera…");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
    });
    video = createVideo([]);
    video.hide();
    video.elt.muted = true;
    video.elt.playsInline = true;
    video.elt.srcObject = stream;
    await video.elt.play();
    video.loadedmetadata = true;
  } catch (error) {
    stream?.getTracks().forEach(track => track.stop());
    video?.remove();
    video = undefined;
    setStatus("hand-status", "Camera unavailable · click or tap bubbles");
    console.warn("Camera initialization:", error);
    button.disabled = false;
    return;
  }
  button.textContent = "Camera enabled";
  void startHandPose();
  if (!demo) void startClassifier();
}

async function startHandPose() {
  setStatus("hand-status", "Loading HandPose");
  try {
    handPose = await ml5.handPose({ maxHands: 1, flipped: false });
    await handPose.ready;
    handPose.detectStart(video, gotHands);
    setStatus("hand-status", "HandPose ready · move your index finger");
  } catch (error) {
    setStatus("hand-status", "HandPose unavailable · click or tap bubbles");
    console.warn("HandPose:", error);
  }
}

async function loadObjectClassifier() {
  // ml5 and the object model use different TFJS versions with global registries.
  const runtime = document.createElement("iframe");
  runtime.hidden = true;
  runtime.title = "Object classifier runtime";
  runtime.src = "./classifier-runtime.html";
  await new Promise((resolve, reject) => {
    runtime.onload = resolve;
    runtime.onerror = () => reject(new Error("Could not open classifier runtime"));
    document.body.append(runtime);
  }).catch(error => {
    runtime.remove();
    throw error;
  });
  try {
    const { tf, tmImage, document: runtimeDocument } = runtime.contentWindow;
    if (!tf || !tmImage) throw new Error("Classifier libraries did not load");
    await tf.ready();
    const model = await loadObjectModel(tf, tmImage);
    const canvas = runtimeDocument.createElement("canvas");
    canvas.width = canvas.height = 224;
    const context = canvas.getContext("2d");
    return {
      getClassLabels: () => model.getClassLabels(),
      predict(frame) {
        const width = frame.videoWidth || frame.width;
        const height = frame.videoHeight || frame.height;
        const size = Math.min(width, height);
        context.drawImage(frame, (width - size) / 2, (height - size) / 2, size, size, 0, 0, 224, 224);
        return model.predict(canvas);
      }
    };
  } catch (error) {
    runtime.remove();
    throw error;
  }
}

async function loadObjectModel(tf, tmImage) {
  const configured = hostedModelURL.trim();
  const base = new URL(configured ? configured.replace(/\/?$/, "/") : "./model/", location.href);
  const modelURL = new URL("model.json", base).href;
  const metadataURL = new URL("metadata.json", base).href;
  if (configured) return tmImage.load(modelURL, metadataURL);

  const response = await fetch(metadataURL);
  if (!response.ok) throw new Error("Could not read object model metadata");
  const metadata = await response.json();
  if (metadata.format !== "cocoon-mobilenet-v2") return tmImage.load(modelURL, metadataURL);

  const [backbone, head] = await Promise.all([
    tf.loadGraphModel(new URL("backbone/model.json", base).href),
    tf.loadLayersModel(modelURL)
  ]);
  return {
    getClassLabels: () => metadata.labels,
    async predict(frame) {
      const prediction = tf.tidy(() => {
        const pixels = tf.browser.fromPixels(frame);
        return head.predict(embedCocoonImage(tf, backbone, pixels));
      });
      try {
        const scores = await prediction.data();
        return metadata.labels.map((className, i) => ({ className, probability: scores[i] }));
      } finally {
        prediction.dispose();
      }
    }
  };
}

let classifierPromise;

function prepareClassifier() {
  classifierPromise ??= initializeClassifier().catch(error => {
    classifierPromise = undefined;
    throw error;
  });
  return classifierPromise;
}

async function initializeClassifier() {
  setStatus("model-status", "Loading Model");
  const model = await loadObjectClassifier();
  const labels = model.getClassLabels();
  if (labels.length !== 4 || ![...items, "Background"].every(label => labels.includes(label))) {
    throw new Error("Expected Phone, Mouse, Book and Background. Received: " + labels.join(", "));
  }
  if (objectDebug) {
    const warmup = document.createElement("canvas");
    warmup.width = warmup.height = 224;
    await model.predict(warmup);
  }
  setStatus("model-status", "Model ready · waiting for camera frames");
  return model;
}

function reportClassifierError(stage, error) {
  setStatus("model-status", "Object classifier " + stage + " failed: " + error.message);
  console.error("Object classifier " + stage, error);
}

async function startClassifier() {
  let model;
  try {
    model = await prepareClassifier();
  } catch (error) {
    reportClassifierError("loading or warm-up", error);
    return;
  }
  const frame = video.elt;
  let lastVideoTime = -1;
  let frames = 0;
  async function classify() {
    try {
      if (!document.hidden && frame.readyState >= 2 && frame.videoWidth &&
          frame.currentTime !== lastVideoTime) {
        lastVideoTime = frame.currentTime;
        const generation = feed.generation;
        const predictions = await model.predict(frame);
        frames++;
        if (objectDebug) {
          setStatus("object-frames", "Camera " + frame.videoWidth + "×" + frame.videoHeight +
            " · predictions " + frames + " · HandPose " +
            (performance.now() - lastHandUpdate < 1000 ? "receiving frames" : "waiting for results"));
          setStatus("object-scores", predictions.map(({ className, probability }) =>
            className + " " + (probability * 100).toFixed(1) + "%").join(" · "));
        }
        if (generation === feed.generation) {
          const best = predictions.reduce((a, b) => a.probability >= b.probability ? a : b);
          const detected = feed.observe(best.className, best.probability);
          setStatus("model-status", detected ? "Unlocked " + detected :
            best.className + " " + (best.probability * 100).toFixed(1) + "%" +
            (items.includes(best.className) ? " · " + feed.streak + "/" + objectFramesRequired +
              " frames ≥ " + (objectThreshold * 100) + "%" : ""));
          renderFeed();
        }
      }
    } catch (error) {
      reportClassifierError("inference", error);
      return;
    }
    setTimeout(classify, 250);
  }
  void classify();
}

function drawItem(item, size) {
  push();
  scale(size / 24);
  translate(-12, -12);
  noFill();
  stroke(246, 243, 255, 190);
  strokeWeight(1.15);
  if (item === "Phone") {
    rect(6, 2, 12, 20, 2.5);
    line(10, 19, 14, 19);
  } else if (item === "Mouse") {
    rect(5, 2, 14, 20, 6);
    line(5, 10, 19, 10);
    line(12, 4.5, 12, 7.5);
  } else {
    rect(3, 4, 18, 15, 1.5);
    line(12, 4, 12, 19);
    line(6, 8, 9, 8);
    line(15, 8, 18, 8);
  }
  pop();
}


