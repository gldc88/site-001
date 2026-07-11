<script setup>
import { ref, computed } from 'vue';

// Live scope estimator for the NORTHRIDGE hero.
const squareMeters = ref(45);
const quality = ref('standard'); // cosmetic · standard · premium

const RATES = { cosmetic: 850, standard: 1450, premium: 2200 };
const LABELS = { cosmetic: 'Cosmetic refresh', standard: 'Full strip & rebuild', premium: 'Premium / structural' };

const fmt = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

// Indicative band: ±12% around the base rate.
const low = computed(() => fmt(squareMeters.value * RATES[quality.value] * 0.88));
const high = computed(() => fmt(squareMeters.value * RATES[quality.value] * 1.12));
const perM2 = computed(() => fmt(RATES[quality.value]));
</script>

<template>
  <div class="calc">
    <div class="head">
      <div class="ic" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16M4 8h16M4 12h16M4 16h6M14 16h6M7 20h10"/></svg>
      </div>
      <div>
        <h3 class="title">Scope estimate</h3>
        <p class="sub">Live figure from area and finish level.</p>
      </div>
    </div>

    <div class="controls">
      <label class="ctl">
        <span class="lt">Area <strong>{{ squareMeters }} m²</strong></span>
        <input type="range" v-model="squareMeters" min="10" max="200" step="5" class="slider" aria-label="Area in square metres" />
      </label>

      <label class="ctl">
        <span class="lt">Finish level</span>
        <select v-model="quality" class="select" aria-label="Finish level">
          <option value="cosmetic">Cosmetic refresh</option>
          <option value="standard">Full strip &amp; rebuild</option>
          <option value="premium">Premium / structural</option>
        </select>
      </label>
    </div>

    <div class="result">
      <div class="rl">Indicative scope budget · {{ LABELS[quality] }}</div>
      <div class="band">{{ low }} <span class="dash">–</span> {{ high }}</div>
      <div class="foot"><span>{{ perM2 }} / m²</span><span>Confirmed after a site visit</span></div>
    </div>
  </div>
</template>

<style scoped>
.calc { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 1.6rem; margin-top: 2rem; backdrop-filter: blur(10px); }
.head { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
.ic { width: 2.5rem; height: 2.5rem; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.34); border-radius: 0.75rem; display: grid; place-items: center; color: #34d399; }
.ic svg { width: 1.2rem; height: 1.2rem; }
.title { font-size: 1rem; font-weight: 600; color: #fff; margin: 0; letter-spacing: -0.01em; }
.sub { font-size: 0.75rem; color: #a1a1aa; margin: 0; }
.controls { display: grid; gap: 1.25rem; margin-bottom: 1.4rem; }
.lt { display: flex; justify-content: space-between; font-size: 0.8rem; color: #d4d4d8; margin-bottom: 0.55rem; text-transform: none; }
.lt strong { color: #fff; }
.slider { width: 100%; height: 4px; background: #2a2a2e; border-radius: 2px; appearance: none; -webkit-appearance: none; outline: none; }
.slider::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; background: #34d399; border-radius: 50%; cursor: pointer; box-shadow: 0 0 0 4px rgba(52,211,153,0.15); }
.slider::-moz-range-thumb { width: 14px; height: 14px; background: #34d399; border-radius: 50%; border: none; cursor: pointer; }
.select { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid #3a3a3e; color: #fff; padding: 0.65rem 0.7rem; border-radius: 0.6rem; outline: none; font-size: 0.9rem; }
.select:focus { border-color: #34d399; }
.result { background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.06); padding: 1.1rem 1.2rem; border-radius: 1rem; }
.rl { font-size: 0.65rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.12em; }
.band { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0.4rem 0 0.5rem; letter-spacing: -0.02em; }
.band .dash { color: #52525b; font-weight: 300; margin: 0 0.15rem; }
.foot { display: flex; justify-content: space-between; font-size: 0.66rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; }
.foot span:first-child { color: #34d399; }
</style>
