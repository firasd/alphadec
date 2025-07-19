# AlphaDec

A timezone-agnostic, readable time format for humans, machines, and AI.

**[Live Demo](https://firasd.github.io/alphadec/)**

Example:
- **AlphaDec:** `2025_L0V3` (or full canonical: `2025_L0V3_000000`)
- **UTC:** June 5th, 2025 at 13:45

AlphaDec encodes any UTC timestamp into a readable string that sorts chronologically.
This simple concept unlocks a host of powerful emergent properties.

## Key Properties

-   **Lexically Sortable**: Natively time-sortable in any system that can sort strings alphabetically. Perfect for database primary keys.
-   **Time-Series Friendly**: Truncate the string for efficient time-range queries. `2024_M` finds everything in that ~14-day period.
-   **Human-Readable & Compact**: Understand a timestamp's approximate place in the year at a glance.
-   **LLM & AI-Native**: Its structured, tokenizable nature makes it a powerful primitive for time-based reasoning, prompt engineering, and log analysis in AI systems.

## How It Works

The AlphaDec string is composed of several parts:

`YYYY_PaBt_MMMMMM`

-   **YYYY**: The UTC year.
-   **P (Period)**: The year is divided into 26 periods, represented by letters `A` through `Z`. Each period is roughly 14 days long.
-   **a (Arc)**: Each period is divided into 10 arcs, numbered `0` through `9`. Each arc is roughly 33.7 hours long.
-   **B (Bar)**: Each arc is divided into 26 bars, `A` through `Z`. Each bar is roughly 77.8 minutes long.
-   **t (Beat)**: Each bar is divided into 10 beats, `0` through `9`. Each beat is roughly 7.8 minutes long.
-   **MMMMMM**: The number of milliseconds that have elapsed within the current beat.

## Implementations

This project is language-agnostic. Below are examples of how to generate an AlphaDec string.

<details>
<summary>JavaScript Implementation</summary>

```javascript
const clock = {
  alphadec: {
    _SCALER: 1_000_000,
    _toBase26(n) {
      if (n < 0 || n > 25) throw new Error("Invalid index for Base26.");
      return String.fromCharCode(65 + n);
    },
    encode(d) {
      const y = d.getUTCFullYear();
      const SCALER = this._SCALER;
      const msSinceYearStart_float = d.getTime() - Date.UTC(y, 0, 1, 0, 0, 0, 0);
      const totalScaledMsSinceYearStart = Math.floor(msSinceYearStart_float * SCALER);
      const isLeap = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0);
      const daysInYear = isLeap ? 366 : 365;
      const yearTotalMs_float = daysInYear * 86_400_000;
      const yearTotalScaledMs = Math.floor(yearTotalMs_float * SCALER);
      const periodSizeScaled = Math.floor(yearTotalScaledMs / 26);
      const arcSizeScaled    = Math.floor(periodSizeScaled / 10);
      const barSizeScaled    = Math.floor(arcSizeScaled / 26);
      const beatSizeScaled   = Math.floor(barSizeScaled / 10);
      let remainingScaledMs = totalScaledMsSinceYearStart;
      const p_idx = Math.floor(remainingScaledMs / periodSizeScaled);
      remainingScaledMs -= p_idx * periodSizeScaled;
      const a_val = Math.floor(remainingScaledMs / arcSizeScaled);
      remainingScaledMs -= a_val * arcSizeScaled;
      const b_idx = Math.floor(remainingScaledMs / barSizeScaled);
      remainingScaledMs -= b_idx * barSizeScaled;
      const t_val = Math.floor(remainingScaledMs / beatSizeScaled);
      remainingScaledMs -= t_val * beatSizeScaled;
      const msOffsetInBeat = Math.floor(remainingScaledMs / SCALER);
      const periodLetter = this._toBase26(p_idx);
      const barLetter    = this._toBase26(b_idx);
      const canonicalMsPart = msOffsetInBeat.toString().padStart(6, "0");
      const canonical = `${y}_${periodLetter}${a_val}${barLetter}${t_val}_${canonicalMsPart}`;
      return { canonical };
    }
  }
};
```
</details>

<details>
<summary>PHP Implementation</summary>

```php
<?php
/**
 * Generates a lexically sortable AlphaDec timestamp from a DateTime object.
 *
 * @param DateTime|null $datetime The datetime to encode. Defaults to UTC now.
 * @return string The canonical AlphaDec string (e.g., "2024_M5C3_123456").
 * @throws Exception If the provided datetime is invalid.
 *
 * NOTE: This function requires a 64-bit PHP environment due to large integer calculations.
 */
function generate_alphadec(DateTime $datetime = null): string {
    // If no datetime is provided, use the current time in UTC.
    if ($datetime === null) {
        $datetime = new DateTime("now", new DateTimeZone("UTC"));
    }

    $y = (int)$datetime->format("Y");
    
    // SCALER is used to perform calculations with integer math to avoid float precision issues.
    $SCALER = 1000000;

    // Calculate the total milliseconds that have passed since the beginning of the year.
    $startOfYear = new DateTime("$y-01-01T00:00:00Z");
    $msSinceYearStart = ($datetime->format('U.v') - $startOfYear->format('U.v')) * 1000;

    // Scale up for integer-based math.
    $totalScaledMsSinceYearStart = (int)floor($msSinceYearStart * $SCALER);

    // Determine the total number of milliseconds in the current year.
    $isLeap = (bool)$datetime->format('L');
    $daysInYear = $isLeap ? 366 : 365;
    $yearTotalMs = $daysInYear * 86400000;
    $yearTotalScaledMs = (int)floor($yearTotalMs * $SCALER);

    // Calculate the size of each AlphaDec time unit in scaled milliseconds.
    $periodSizeScaled = (int)floor($yearTotalScaledMs / 26); // ~14 days
    $arcSizeScaled    = (int)floor($periodSizeScaled / 10);   // ~33.7 hours
    $barSizeScaled    = (int)floor($arcSizeScaled / 26);      // ~77.8 minutes
    $beatSizeScaled   = (int)floor($barSizeScaled / 10);      // ~7.8 minutes

    // Use division and remainder to find the index of each time unit.
    $remaining = $totalScaledMsSinceYearStart;

    $p_idx = (int)floor($remaining / $periodSizeScaled); $remaining -= $p_idx * $periodSizeScaled;
    $a_val = (int)floor($remaining / $arcSizeScaled);   $remaining -= $a_val * $arcSizeScaled;
    $b_idx = (int)floor($remaining / $barSizeScaled);   $remaining -= $b_idx * $barSizeScaled;
    $t_val = (int)floor($remaining / $beatSizeScaled);  $remaining -= $t_val * $beatSizeScaled;

    // The final remainder is the millisecond offset within the current "beat".
    $msOffsetInBeat = (int)floor($remaining / $SCALER);

    // Convert numeric indices to their character representation (A-Z).
    $periodLetter = chr(65 + $p_idx);
    $barLetter    = chr(65 + $b_idx);
    
    // Format the final milliseconds part to be 6 digits, zero-padded.
    $canonicalMsPart = str_pad((string)$msOffsetInBeat, 6, "0", STR_PAD_LEFT);

    // Assemble the final canonical string.
    return "{$y}_{$periodLetter}{$a_val}{$barLetter}{$t_val}_{$canonicalMsPart}";
}
?>
```
</details>

## Emergent Properties

While AlphaDec was designed as a verbally chunked and compressed form of UTC, the mathematical structure leads to many emergent properties.
For example:
- AlphaDec timestamps are quite rhythmic: M2L3 ticks over to M2L4, etc.
- Period F, Period M, Period S, and Period Z always bracket equinoxes and solstices, even in leap years when AlphaDec units stretch to accomodate the longer UTC year.
- AlphaDec can be used as readable, chronological ID fragments such as prefixes and suffixes.

---
Designed by Firas Durri • [https://twitter.com/firasd](https://twitter.com/firasd) • [https://www.linkedin.com/in/firasd](https://www.linkedin.com/in/firasd)
