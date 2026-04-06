<script setup>
import { ref, computed } from 'vue';

// V13 REACTIVE STATE
const squareMeters = ref(45);
const quality = ref('standard'); // options: cosmetic, standard, premium

// LOGIC ENGINE
const prices = {
  cosmetic: 850,
  standard: 1450,
  premium: 2200
};

const estimatedCost = computed(() => {
  const base = squareMeters.value * prices[quality.value];
  // Add 10% contingency buffer conform V13 safety logic
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(base);
});
</script>

<template>
  <div class="vue-panel">
    <div class="header">
      <div class="icon-box">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 0"/><path d="M4 8l16 0"/><path d="M4 12l16 0"/><path d="M4 16l6 0"/><path d="M14 16l6 0"/><path d="M7 20l10 0"/></svg>
      </div>
      <div>
        <h3 class="title">Quick Estimate</h3>
        <p class="subtitle">Live calculation based on surface area.</p>
      </div>
    </div>

    <div class="controls">
      <label>
        <span class="label-text">Area size: <strong>{{ squareMeters }} m²</strong></span>
        <input type="range" v-model="squareMeters" min="10" max="200" step="5" class="slider">
      </label>

      <label>
        <span class="label-text">Finish level</span>
        <select v-model="quality" class="selector">
          <option value="cosmetic">Cosmetic (Refresh)</option>
          <option value="standard">Standard (Full Strip)</option>
          <option value="premium">Premium (Structural)</option>
        </select>
      </label>
    </div>

    <div class="result-box">
      <div class="label-xs">Estimated Scope Budget</div>
      <div class="price">{{ estimatedCost }}</div>
      <div class="disclaimer">*Indicative. Requires site visit.</div>
    </div>
  </div>
</template>

<style scoped>
/* Inherits CSS Variables from global Astro styles (website20.astro) */
.vue-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem; /* Matches --radius-xl */
  padding: 1.5rem;
  margin-top: 2rem;
  backdrop-filter: blur(10px);
}

.header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
.icon-box {
  width: 2.5rem; height: 2.5rem; background: rgba(65, 184, 131, 0.2); /* Vue Green tint */
  border: 1px solid rgba(65, 184, 131, 0.4); border-radius: 0.75rem;
  display: grid; place-items: center; color: #41B883;
}
.icon-box svg { width: 1.25rem; height: 1.25rem; }

.title { font-size: 1rem; font-weight: 600; color: white; }
.subtitle { font-size: 0.75rem; color: #a1a1aa; } /* --c-400 */

.controls { display: grid; gap: 1.25rem; margin-bottom: 1.5rem; }
.label-text { display: flex; justify-content: space-between; font-size: 0.8rem; color: #d4d4d8; margin-bottom: 0.5rem; }
.label-text strong { color: white; }

.slider {
  width: 100%; height: 4px; background: #3f3f46; border-radius: 2px;
  appearance: none; outline: none;
}
.slider::-webkit-slider-thumb {
  appearance: none; width: 16px; height: 16px; background: #41B883; border-radius: 50%; cursor: pointer;
}

.selector {
  width: 100%; background: rgba(0,0,0,0.4); border: 1px solid #3f3f46;
  color: white; padding: 0.6rem; border-radius: 0.5rem; outline: none;
}

.result-box {
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.05);
  padding: 1rem; border-radius: 1rem; text-align: center;
}
.label-xs { font-size: 0.7rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; }
.price { font-size: 1.5rem; font-weight: 700; color: white; margin: 0.25rem 0; }
.disclaimer { font-size: 0.65rem; color: #52525b; }
</style>