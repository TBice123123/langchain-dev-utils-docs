<template>
  <div class="step-item">
    <div class="step-number">
      <span>{{ stepNumber }}</span>
    </div>
    <div class="step-content">
      <div v-if="title" class="step-title">{{ title }}</div>
      <div class="step-body">
        <slot></slot>
      </div>
    </div>
    <div class="step-line" v-if="hasNext"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  step: number | string;
  title?: string;
  hasNext?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hasNext: true
});

const stepNumber = computed(() => props.step);
</script>

<style scoped>
.step-item {
  position: relative;
  padding-left: 2.5rem;
}

.step-item:last-child {
  padding-bottom: 0;
}

.step-number {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #424242;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  position: absolute;
  left: 0;
  top: 0;
  transition: all 0.3s ease;
  border: 2px solid #424242;
}

.step-content {
  margin-left: 0.125rem;
  padding-top: 0.25rem;
}

.step-title {
  font-size: 1.125rem;
  color: #212121;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  line-height: 1.5;
}

.step-body {
  font-size: 0.875rem;
  color: #444;
  line-height: 1.6;
}

.step-body :deep(p) {
  margin-bottom: 0.75rem;
}

.step-body :deep(p:last-child) {
  margin-bottom: 0;
}

.step-body :deep(code) {
  background-color: #f5f5f5;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.8125rem;
  color: #424242;
}

.step-body :deep(pre) {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.step-line {
  position: absolute;
  left: 0.875rem;
  top: 2.25rem;
  width: 2px;
  height: calc(100% + 0.5rem);
  background-color: #424242;
  z-index: -1;
  transition: all 0.3s ease;
}

.dark .step-number {
  background-color: white;
  color: #212121;
  border-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dark .step-title {
  color: #e0e0e0;
  border-bottom-color: #424242;
}

.dark .step-body {
  color: #bdbdbd;
}

.dark .step-body :deep(code) {
  background-color: #616161;
  color: #e0e0e0;
}

.dark .step-body :deep(pre) {
  background-color: #616161;
  color: #e0e0e0;
}

.dark .step-line {
  background-color: white;
  opacity: 0.8;
}

/* 也支持系统级暗色模式 */
@media (prefers-color-scheme: dark) {
  :root:not(.light) .step-number {
    background-color: white;
    color: #212121;
    border-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  :root:not(.light) .step-title {
    color: #e0e0e0;
    border-bottom-color: #424242;
  }

  :root:not(.light) .step-body {
    color: #bdbdbd;
  }

  :root:not(.light) .step-body :deep(code) {
    background-color: #616161;
    color: #e0e0e0;
  }

  :root:not(.light) .step-body :deep(pre) {
    background-color: #616161;
    color: #e0e0e0;
  }

  :root:not(.light) .step-line {
    background-color: white;
    opacity: 0.8;
  }
}
</style>