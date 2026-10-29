const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const superscriptMap = { "-": "⁻", ".": "·", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const toSuperscript = (value) => String(value).split("").map((char) => superscriptMap[char] ?? char).join("");

function setPanel(panelId) {
  $$(".tab").forEach((button) => {
    const active = button.dataset.panel === panelId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
}

$$(".tab").forEach((button) => button.addEventListener("click", () => setPanel(button.dataset.panel)));

function formatLogPower(log10Value, decimals = 1) {
  const exponent = Math.floor(log10Value);
  const mantissa = Math.pow(10, log10Value - exponent);
  return { exponent, mantissa, label: `${mantissa.toFixed(decimals)} × 10${toSuperscript(exponent)}` };
}

function formatDuration(log10Seconds) {
  if (log10Seconds < -3) return `${formatLogPower(log10Seconds + 3).label} ms`;
  if (log10Seconds < 2) return `${Math.pow(10, log10Seconds).toFixed(2)}초`;
  const log10Years = log10Seconds - Math.log10(365.25 * 24 * 3600);
  if (log10Years < 0) return `${(Math.pow(10, log10Seconds) / 86400).toFixed(1)}일`;
  const years = formatLogPower(log10Years);
  return `약 ${years.label}년`;
}

function calculateGNFS() {
  const rawNumber = $("#number-input").value.replace(/[\s,_]/g, "");
  const error = $("#complexity-error");
  if (!/^\d+$/.test(rawNumber) || rawNumber.length > 5000 || /^0+$/.test(rawNumber)) {
    error.textContent = "1에서 5,000자리 사이의 양의 정수를 입력하세요.";
    return;
  }
  const normalized = rawNumber.replace(/^0+/, "");
  if (normalized === "1" || normalized === "2") {
    error.textContent = "2보다 큰 정수를 입력하세요.";
    return;
  }

  error.textContent = "";
  const digits = normalized.length;
  const leadingLength = Math.min(15, digits);
  const leading = Number(normalized.slice(0, leadingLength));
  const log10N = Math.log10(leading) + digits - leadingLength;
  const lnN = log10N * Math.LN10;
  const bits = Math.floor(log10N / Math.log10(2)) + 1;
  const c = Math.cbrt(64 / 9);
  const lnWork = c * Math.cbrt(lnN) * Math.pow(Math.log(lnN), 2 / 3);
  const log10Work = lnWork / Math.LN10;
  const speedPower = Number($("#ops-speed").value);
  const log10Seconds = log10Work - speedPower;
  const work = formatLogPower(log10Work);

  $("#work-result").innerHTML = `${work.mantissa.toFixed(1)} × 10<sup>${work.exponent}</sup>`;
  $("#normalized-size").textContent = `${bits.toLocaleString()} bits · ${digits.toLocaleString()} digits`;
  $("#operation-result").textContent = `${work.label}회`;
  $("#time-result").textContent = formatDuration(log10Seconds);
  const universeLogSeconds = Math.log10(13.8e9 * 365.25 * 24 * 3600);
  const timelinePosition = Math.max(0, Math.min(100, (log10Seconds / universeLogSeconds) * 100));
  $("#time-marker").style.left = `${timelinePosition}%`;
}

$("#calculate-complexity").addEventListener("click", calculateGNFS);
$("#ops-speed").addEventListener("change", calculateGNFS);
$("#number-input").addEventListener("keydown", (event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) calculateGNFS(); });
$$('[data-number], [data-digits]').forEach((button) => button.addEventListener("click", () => {
  const value = button.dataset.number ?? (`1${"0".repeat(Number(button.dataset.digits) - 2)}3`);
  $("#number-input").value = value;
  $$('[data-number], [data-digits]').forEach((item) => item.classList.toggle("selected", item === button));
  calculateGNFS();
}));

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a < 0n ? -a : a;
}

function modPow(base, exponent, modulus) {
  let result = 1n;
  base %= modulus;
  while (exponent > 0n) {
    if (exponent & 1n) result = (result * base) % modulus;
    base = (base * base) % modulus;
    exponent >>= 1n;
  }
  return result;
}

function renderPeriodRows(values, period) {
  const shown = values.slice(0, 400);
  $("#sequence").innerHTML = shown.map((value, index) => `<span class="term${index === period ? " repeat" : ""}" title="x=${index}">${value}</span>`).join("");
  $("#period-table").innerHTML = shown.map((value, index) => {
    const state = index === 0 ? "시작" : index === period ? "1로 복귀" : "탐색";
    return `<tr><td>${index}</td><td>${value}</td><td>${state}</td></tr>`;
  }).join("");
}

function renderFactorSteps(lines, successIndex = -1) {
  $("#factor-steps").innerHTML = lines.map((line, index) => `<div class="factor-step${index === successIndex ? " success" : ""}">${line}</div>`).join("");
}

function findPeriod() {
  const nNumber = Number($("#period-n").value);
  const aNumber = Number($("#period-a").value);
  const error = $("#period-error");

  if (!Number.isSafeInteger(nNumber) || nNumber < 3 || nNumber > 100000) {
    error.textContent = "N은 3에서 100,000 사이의 정수로 입력하세요.";
    return;
  }
  if (!Number.isSafeInteger(aNumber) || aNumber <= 1 || aNumber >= nNumber) {
    error.textContent = "a는 1보다 크고 N보다 작은 정수여야 합니다.";
    return;
  }

  error.textContent = "";
  const n = BigInt(nNumber);
  const a = BigInt(aNumber);
  const common = gcd(a, n);

  if (common > 1n) {
    const other = n / common;
    $("#period-r").textContent = "—";
    $("#period-steps").textContent = "0회";
    $("#factor-result").textContent = `${n} = ${common} × ${other}`;
    renderPeriodRows(["1"], -1);
    renderFactorSteps([`gcd(${a}, ${n}) = ${common}`, `주기 탐색 전에 인수 발견: ${n} = ${common} × ${other}`], 1);
    return;
  }

  const values = ["1"];
  let value = 1n;
  let period = 0;
  const limit = Math.min(nNumber, 100000);
  for (let x = 1; x <= limit; x += 1) {
    value = (value * a) % n;
    values.push(value.toString());
    if (value === 1n) { period = x; break; }
  }

  if (!period) {
    $("#period-r").textContent = "—";
    $("#period-steps").textContent = `${limit.toLocaleString()}회`;
    $("#factor-result").textContent = "탐색 한도 초과";
    renderPeriodRows(values, -1);
    renderFactorSteps([`최대 ${limit.toLocaleString()}회까지 검사`, "주기를 찾지 못함"]);
    return;
  }

  $("#period-r").textContent = period.toLocaleString();
  $("#period-steps").textContent = `${period.toLocaleString()}회`;
  renderPeriodRows(values, period);

  if (period % 2 !== 0) {
    $("#factor-result").textContent = "인수 추출 실패";
    renderFactorSteps([`r = ${period}`, "r이 홀수이므로 다른 a가 필요함"]);
    return;
  }

  const halfPower = modPow(a, BigInt(period / 2), n);
  const p = gcd(halfPower - 1n, n);
  const q = gcd(halfPower + 1n, n);
  const valid = p > 1n && p < n && q > 1n && q < n;
  const minusOne = n - 1n;

  if (!valid || halfPower === minusOne) {
    $("#factor-result").textContent = "인수 추출 실패";
    renderFactorSteps([
      `r = ${period}`,
      `${a}<sup>r/2</sup> mod ${n} = ${halfPower}`,
      `gcd(${halfPower} − 1, ${n}) = ${p}`,
      `gcd(${halfPower} + 1, ${n}) = ${q}`,
      "다른 a로 재시도"
    ]);
    return;
  }

  const low = p < q ? p : q;
  const high = p < q ? q : p;
  $("#factor-result").textContent = `${n} = ${low} × ${high}`;
  renderFactorSteps([
    `r = ${period}`,
    `${a}<sup>r/2</sup> mod ${n} = ${halfPower}`,
    `gcd(${halfPower} − 1, ${n}) = ${p}`,
    `gcd(${halfPower} + 1, ${n}) = ${q}`,
    `${n} = ${low} × ${high}`
  ], 4);
}

$("#find-period").addEventListener("click", findPeriod);
[$("#period-n"), $("#period-a")].forEach((input) => input.addEventListener("keydown", (event) => { if (event.key === "Enter") findPeriod(); }));
$$("[data-n]").forEach((button) => button.addEventListener("click", () => {
  $("#period-n").value = button.dataset.n;
  $("#period-a").value = button.dataset.a;
  $$("[data-n]").forEach((item) => item.classList.toggle("selected", item === button));
  findPeriod();
}));

calculateGNFS();
findPeriod();

