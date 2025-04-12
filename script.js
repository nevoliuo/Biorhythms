let birthDay = "2008-08-27";
const birthDate = new Date(birthDay);
const dateInput = document.querySelector("#target-date");
const rangeInput = document.getElementById("range-days");
const canvas = document.getElementById("biorhythm-chart");
const ctx = canvas.getContext("2d");

const today = new Date();
dateInput.value = today.toISOString().split("T")[0];

function fixCanvasDPI() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

function calculateDays(targetDate) {
  const diffMs = targetDate - birthDate;
  const msPerDay = 24 * 60 * 60 * 1000;
  return diffMs / msPerDay;
}

function calculateBiorhythms(days) {
  return [
    Math.sin((2 * Math.PI * days) / 23),
    Math.sin((2 * Math.PI * days) / 28),
    Math.sin((2 * Math.PI * days) / 33),
  ];
}

function drawAxes(centerY, width, height, range, targetDate) {
  const marginX = 20;

  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  const highlightX = marginX + (range / (range * 2)) * (width - 2 * marginX);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(highlightX, 0);
  ctx.lineTo(highlightX, height);
  ctx.stroke();

  const approxLabelSpacing = 60;
  const maxLabels = Math.floor((width - 2 * marginX) / approxLabelSpacing);
  const stepX = Math.max(1, Math.floor((range * 2) / maxLabels));
  const totalSteps = Math.floor((range * 2) / stepX);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#aaa";
  ctx.textAlign = "center";

  for (let i = 0; i <= totalSteps; i++) {
    const dayOffset = -range + i * stepX;
    const x =
      marginX + ((dayOffset + range) / (range * 2)) * (width - 2 * marginX);
    const labelDate = new Date(targetDate);
    labelDate.setDate(labelDate.getDate() + dayOffset);
    const label = labelDate.toLocaleDateString("ru-RU").slice(0, 5);
    ctx.fillText(label, x, centerY + 24);
  }

  ctx.textAlign = "left";
  const ySteps = 4;
  for (let i = -ySteps; i <= ySteps; i++) {
    const y = centerY - (i / ySteps) * (height * 0.4);
    ctx.fillStyle = "#999";
    ctx.fillText((i / ySteps).toFixed(1), 5, y - 2);
  }
}

let animationFrame;
let currentFrame = 0;
const maxFrames = 60;
let prevData = [];

function drawGraph() {
  cancelAnimationFrame(animationFrame);
  fixCanvasDPI();

  const targetDate = new Date(dateInput.value);
  const baseDaysPassed = calculateDays(targetDate);
  const range = parseInt(rangeInput.value) || 5;

  const width = canvas.getBoundingClientRect().width;
  const height = canvas.getBoundingClientRect().height;
  const centerY = height / 2;
  const amplitude = height * 0.4;
  const marginX = 20;

  const newData = [];
  for (let i = 0; i < 3; i++) {
    const data = [];
    for (let x = 0; x <= width; x++) {
      const plotX = marginX + (x / width) * (width - 2 * marginX);
      const dayOffset =
        ((plotX - marginX) / (width - 2 * marginX)) * range * 2 - range;
      const daysPassed = baseDaysPassed + dayOffset;
      const value = calculateBiorhythms(daysPassed)[i];
      const y = centerY - value * amplitude;
      data.push(y);
    }
    newData.push(data);
  }

  if (!prevData.length) {
    prevData = newData;
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    drawAxes(centerY, width, height, range, targetDate);

    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    const colors = ["#F28C8C", "#8CBDF2", "#8CF2B3"];

    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = colors[i];
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        const y =
          prevData[i][x] +
          (newData[i][x] - prevData[i][x]) * (currentFrame / maxFrames);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (currentFrame < maxFrames) {
      currentFrame++;
      animationFrame = requestAnimationFrame(animate);
    } else {
      prevData = newData;
      currentFrame = 0;
    }
  }

  animate();
}

dateInput.addEventListener("input", drawGraph);
rangeInput.addEventListener("input", drawGraph);

rangeInput.addEventListener("blur", () => {
  if (!rangeInput.value || isNaN(parseInt(rangeInput.value))) {
    rangeInput.value = 5;
    drawGraph();
  }
});

window.addEventListener("resize", drawGraph);
drawGraph();
