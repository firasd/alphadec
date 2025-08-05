const fs = require("fs");
const path = require("path");

const readmePath = path.resolve(__dirname, "../../README.md");
const content = fs.readFileSync(readmePath, "utf8");

const clock = {
  alphadec: {
    _SCALER_N: 1_000_000n, // Use 'n' to denote a BigInt

    _toBase26(n) {
      if (n < 0 || n > 25) throw new Error("Invalid index for Base26 single char conversion.");
      return String.fromCharCode(65 + n);
    },

    encode(d) {
      const y = d.getUTCFullYear();
      const SCALER_N = this._SCALER_N;

      const msSinceYearStart = d.getTime() - Date.UTC(y, 0, 1, 0, 0, 0, 0);
      const totalScaledMsSinceYearStart = BigInt(msSinceYearStart) * SCALER_N;

      const isLeap = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0);
      const daysInYear = isLeap ? 366 : 365;
      const yearTotalScaledMs = BigInt(daysInYear) * 86_400_000n * SCALER_N;

      const periodSizeScaled = yearTotalScaledMs / 26n;
      const arcSizeScaled    = periodSizeScaled / 10n;
      const barSizeScaled    = arcSizeScaled / 26n;
      const beatSizeScaled   = barSizeScaled / 10n;

      let remainingScaledMs = totalScaledMsSinceYearStart;

      const p_idx = remainingScaledMs / periodSizeScaled;
      remainingScaledMs -= p_idx * periodSizeScaled;

      const a_val = remainingScaledMs / arcSizeScaled;
      remainingScaledMs -= a_val * arcSizeScaled;

	    
const currentArcStartScaledMs = (p_idx * periodSizeScaled) + (a_val * arcSizeScaled);
const arcStartMsInYear = Number(currentArcStartScaledMs / SCALER_N);
const arcEndMsInYear = Number((currentArcStartScaledMs + arcSizeScaled) / SCALER_N);
	    

      const b_idx = remainingScaledMs / barSizeScaled;
      remainingScaledMs -= b_idx * barSizeScaled;

      const t_val = remainingScaledMs / beatSizeScaled;
      remainingScaledMs -= t_val * beatSizeScaled;
      
      const msOffsetInBeat = remainingScaledMs / SCALER_N;

      const periodLetter = this._toBase26(Number(p_idx));
      const barLetter    = this._toBase26(Number(b_idx));

      const canonicalMsPart = String(msOffsetInBeat).padStart(6, "0");

      const canonical =
        `${y}_${periodLetter}${a_val}` +
        `${barLetter}${t_val}_` +
        canonicalMsPart;

      const readable = `${periodLetter}${a_val}:${barLetter}${t_val}`;

      return {
        canonical,
        year: y,
        period: Number(p_idx),
        arc: Number(a_val),
        bar: Number(b_idx),
        beat: Number(t_val),
        msOffsetInBeat: Number(msOffsetInBeat),
        periodLetter,
        barLetter,
        readable,
	      arcStartMsInYear,  
arcEndMsInYear, 
        _debug_int_math: {
            totalScaledMsSinceYearStart: totalScaledMsSinceYearStart.toString(),
            yearTotalScaledMs: yearTotalScaledMs.toString(),
            periodSizeScaled: periodSizeScaled.toString(),
            arcSizeScaled: arcSizeScaled.toString(),
            barSizeScaled: barSizeScaled.toString(),
            beatSizeScaled: beatSizeScaled.toString(),
            scaledMsOffsetInBeat: remainingScaledMs.toString()
        }
      };
    },

    decode(canon) {
      const m = canon.match(/^(\d{4})_([A-Z])(\d)([A-Z])(\d)_([0-9]{6})$/);
      if (!m) throw new Error(`Bad AlphaDec canonical string (format YYYY_PaBt_MMMMMM): "${canon}"`);
      const SCALER_N = this._SCALER_N;

      const [, yyyyStr, pLtr, arcStr, barLtr, beatStr, msOffsetStr] = m;

      const year            = Number(yyyyStr);
      const pIndex          = pLtr.charCodeAt(0) - 65;
      const arcVal          = Number(arcStr);
      const barIndex        = barLtr.charCodeAt(0) - 65;
      const beatVal         = Number(beatStr);
      const msOffsetInBeat_input  = Number(msOffsetStr);

      const isLeap = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
      const daysInYear = isLeap ? 366 : 365;
      const yearTotalScaledMs = BigInt(daysInYear) * 86_400_000n * SCALER_N;

      const periodSizeScaled = yearTotalScaledMs / 26n;
      const arcSizeScaled    = periodSizeScaled / 10n;
      const barSizeScaled    = arcSizeScaled / 26n;
      const beatSizeScaled   = barSizeScaled / 10n;

      let totalScaledMsFromUnits = (BigInt(pIndex) * periodSizeScaled) +
                                   (BigInt(arcVal) * arcSizeScaled) +
                                   (BigInt(barIndex) * barSizeScaled) +
                                   (BigInt(beatVal) * beatSizeScaled) +
                                   (BigInt(msOffsetInBeat_input) * SCALER_N);
      
      const totalMsSinceYearStart_final = totalScaledMsFromUnits / SCALER_N;
      
      const startOfYearMs = Date.UTC(year, 0, 1, 0, 0, 0, 0);
      const targetTimestampMs = startOfYearMs + Number(totalMsSinceYearStart_final);

      return new Date(targetTimestampMs);
    }
  }
};

const now = new Date();
const result = clock.alphadec.encode(now);

const arcStartDate = new Date(Date.UTC(result.year, 0, 1) + result.arcStartMsInYear);
const arcEndDate = new Date(Date.UTC(result.year, 0, 1) + result.arcEndMsInYear);

// Compute remaining arc time in hours
const arcRemainingMs = arcEndDate.getTime() - now.getTime();
const arcRemainingHrs = (arcRemainingMs / (1000 * 60 * 60)).toFixed(1);

const alphadecStr = `${result.year}_${result.periodLetter}${result.arc}${result.barLetter}${result.beat}`;

const timezones1 = {
  "Mexico City": "America/Mexico_City",
  "NYC": "America/New_York",
  "Abu Dhabi": "Asia/Dubai"
};

const timezones2 = {
  "Delhi": "Asia/Kolkata",
  "Tokyo": "Asia/Tokyo",
  "Sydney": "Australia/Sydney"
};

// GMT Timestamp
const gmtTimestamp = now.toLocaleString("en-US", {
  timeZone: "GMT",
  weekday: "long",
  day: "numeric", month: "short", year: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true
});

// Build table rows
const row1 = `| **\`${alphadecStr}\`** | ${result.periodLetter}${result.arc} | ${arcRemainingHrs} hrs|`;

const row2 = `|  **${Object.keys(timezones1).join("** |  **")}** |`;
const row3 = `| ${Object.values(timezones1).map(tz =>
  now.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz
  })
).join(" | ")} |`;

const row4 = `| **${Object.keys(timezones2).join("** | **")}** |`;
const row5 = `| ${Object.values(timezones2).map(tz =>
  now.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz
  })
).join(" | ")} |`;

// Final snapshot content
const snapshot = `
Current time snapshot (automatically updated; may be around 1 hour behind):

**GMT**: \`${gmtTimestamp}\`

| AlphaDec | AlphaDec Arc | Arc Remaining Time |
|----------|---------------|--------------------|
${row1}
${row2}
${row3}
${row4}
${row5}
`.trim();

// Replace the snapshot section in the README
const updated = content.replace(
  /<!-- snapshot:start -->[\s\S]*?<!-- snapshot:end -->/,
  `<!-- snapshot:start -->\n${snapshot}\n<!-- snapshot:end -->`
);

fs.writeFileSync(readmePath, updated);
