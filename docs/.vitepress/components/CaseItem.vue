<template>
  <div class="case-card">
    <div class="case-icon">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    </div>
    <div class="case-label">Case {{ caseNumber }}</div>
    <div class="case-content">{{ content }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  step: number | string;
  content: string;
}

const props = defineProps<Props>();

const caseNumber = computed(() => {
  if (typeof props.step === 'number') {
    return props.step;
  }
  // 如果是字符串，提取数字部分
  const match = props.step.match(/\d+/);
  return match ? match[0] : props.step;
});
</script>

<style scoped>
.case-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.case-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.case-icon {
  width: 32px;
  height: 32px;
  background-color: #7c3aed;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.case-icon svg {
  width: 18px;
  height: 18px;
}

.case-label {
  font-size: 13px;
  font-weight: 700;
  color: #7c3aed;
  min-width: 50px;
  flex-shrink: 0;
}

.case-content {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

/* 暗色模式 */
.dark .case-card {
  background: #1f2937;
  border-color: #374151;
}

.dark .case-icon {
  background-color: #a855f7;
}

.dark .case-label {
  color: #c084fc;
}

.dark .case-content {
  color: #e5e7eb;
}

/* 系统级暗色模式 */
@media (prefers-color-scheme: dark) {
  :root:not(.light) .case-card {
    background: #1f2937;
    border-color: #374151;
  }

  :root:not(.light) .case-icon {
    background-color: #a855f7;
  }

  :root:not(.light) .case-label {
    color: #c084fc;
  }

  :root:not(.light) .case-content {
    color: #e5e7eb;
  }
}
</style>