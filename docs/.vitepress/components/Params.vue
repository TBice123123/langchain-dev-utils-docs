<template>
    <div class="param-item" role="listitem">
        <div class="param-header">
            <code class="param-name" :id="paramId">{{ name }}</code>
            <span class="param-type">{{ type }}</span>
            <span v-if="required" class="param-required" aria-label="required parameter">required</span>
        </div>
        <div v-if="description" class="param-description" :aria-describedby="paramId">
            {{ description }}
        </div>
        <div v-if="hasDefault" class="param-default">
            Defaults to <code>{{ default }}</code>.
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
    default?: string | number | boolean;
}

const props = defineProps({
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, default: undefined },
    required: { type: Boolean, default: false },
    default: { type: [String, Number, Boolean], default: undefined }
});

const paramId = computed(() => `param-${props.name.toLowerCase().replace(/\s+/g, '-')}`);
const hasDefault = computed(() => props.default !== null && props.default !== undefined);
</script>

<style scoped>
/* CSS Variables for theming*/
:root {
    --param-border-radius: 4px;
    --param-transition: all 0.15s ease;
    --param-bg: #ffffff;
    --param-bg-hover: #f8fafc;
    --param-border: #e2e8f0;
    --param-border-hover: #cbd5e1;
    --param-name-color: #0f172a;
    --param-description-color: #475569;
    --param-default-color: #64748b;
    --param-type-color: #10b981;
    --param-type-bg: #10b981;
    --param-type-border: transparent;
    --param-required-color: #dc2626;
}

.dark {
    --param-bg: #0f172a;
    --param-bg-hover: #1e293b;
    --param-border: #1e293b;
    --param-border-hover: #334155;
    --param-name-color: #f8fafc;
    --param-description-color: #cbd5e1;
    --param-default-color: #94a3b8;

    --param-type-color: #34d399;
    --param-type-bg: transparent;
    --param-type-border: transparent;
    --param-required-color: #ef4444;
}


@media (prefers-color-scheme: dark) {
    :root:not(.light) {
        --param-bg: #0f172a;
        --param-bg-hover: #1e293b;
        --param-border: #1e293b;
        --param-border-hover: #334155;
        --param-name-color: #f8fafc;
        --param-description-color: #cbd5e1;
        --param-default-color: #94a3b8;
        --param-type-color: #34d399;
        --param-type-bg: transparent;
        --param-type-border: transparent;
        --param-required-color: #ef4444;
    }
}


.param-item {
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    background: var(--param-bg);
    border: 1px solid var(--param-border);
    border-radius: var(--param-border-radius);
    transition: var(--param-transition);
}

.param-item:hover {
    background: var(--param-bg-hover);
    border-color: var(--param-border-hover);
}

.param-item:last-child {
    margin-bottom: 0;
}



.param-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.param-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--param-name-color);
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
}

.param-type {
    font-size: 0.75rem;
    color: var(--param-type-color);
    background: var(--param-type-bg);
    border: 1px solid var(--param-type-border);
    padding: 0;
    border-radius: 0;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    font-weight: 500;
}

.param-required {
    font-size: 0.75rem;
    color: var(--param-required-color);
    font-weight: 500;
}

.param-description {
    color: var(--param-description-color);
    line-height: 1.5;
    margin-top: 0.25rem;
    font-size: 0.875rem;
}

.param-default {
    font-size: 0.875rem;
    color: var(--param-default-color);
    margin-top: 0.25rem;
}

.param-default code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    color: var(--param-name-color);
}


@media (max-width: 640px) {
    .param-item {
        padding: 0.625rem 0.875rem;
        margin-bottom: 0.375rem;
    }

    .param-header {
        gap: 0.5rem;
    }

    .param-name {
        font-size: 0.8125rem;
    }

    .param-type {
        font-size: 0.75rem;
    }

    .param-required {
        font-size: 0.75rem;
    }

    .param-description {
        font-size: 0.8125rem;
    }

    .param-default {
        font-size: 0.8125rem;
    }
}
</style>