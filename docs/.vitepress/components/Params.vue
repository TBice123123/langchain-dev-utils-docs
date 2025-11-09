<template>
    <div class="param-item">
        <div class="param-header">
            <code class="param-name">{{ name }}</code>
            <span class="param-type">{{ type }}</span>
            <span v-if="required" class="param-required">required</span>
        </div>
        <div v-if="description" class="param-description">
            {{ description }}
        </div>
        <div v-if="props.default != null" class="param-default">
            Defaults to <code>{{ default }}</code>.
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
    default?: string | number | boolean;
}

const props = defineProps<Props>();
</script>

<style scoped>
.param-item {
    position: relative;
    padding-bottom: 1.5rem;
}

.param-item:last-child {
    padding-bottom: 0;
}

.param-item::before {
    content: '';
    position: absolute;
    left: -1.75rem;
    top: 0.4rem;
    width: 8px;
    height: 8px;
    background-color: #9ca3af;
    border-radius: 50%;
    border: 2px solid white;
}

.param-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.param-name {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    background: none;
    padding: 0;
}

.param-type {
    font-size: 0.875rem;
    color: #059669;
    font-family: monospace;
}

.param-required {
    font-size: 0.75rem;
    font-weight: 600;
    color: #dc2626;
}

.param-description {
    color: #4b5563;
    line-height: 1.6;
    margin-bottom: 0.5rem;
    padding-left: 0.5rem;
    font-size: 0.95rem;
}

.param-default {
    font-size: 0.875rem;
    color: #6b7280;
}

.param-default code {
    font-family: monospace;
    color: #374151;
    background: none;
    padding: 0;
}

.dark .param-item::before {
    background-color: #9ca3af;
    border-color: #1f2937;
}

.dark .param-name {
    color: #e5e7eb;
}

.dark .param-type {
    color: #34d399;
}

.dark .param-required {
    color: #f87171;
}

.dark .param-description {
    color: #d1d5db;
}

.dark .param-default {
    color: #9ca3af;
}

.dark .param-default code {
    color: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
    :root:not(.light) .param-item::before {
        background-color: #9ca3af;
        border-color: #1f2937;
    }

    :root:not(.light) .param-name {
        color: #e5e7eb;
    }

    :root:not(.light) .param-type {
        color: #34d399;
    }

    :root:not(.light) .param-required {
        color: #f87171;
    }

    :root:not(.light) .param-description {
        color: #d1d5db;
    }

    :root:not(.light) .param-default {
        color: #9ca3af;
    }

    :root:not(.light) .param-default code {
        color: #e5e7eb;
    }
}
</style>