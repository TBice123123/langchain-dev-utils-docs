<template>
    <div class="param-list">
        <div v-for="param in params" :key="param.name" class="param-item">
            <div class="param-header">
                <code class="param-name">{{ param.name }}</code>
                <span class="param-type">{{ param.type }}</span>
                <span v-if="param.required" class="param-required">required</span>
            </div>
            <div v-if="param.description" class="param-description">
                {{ param.description }}
            </div>
            <div v-if="param.defaultValue !== undefined" class="param-default">
                Defaults to <code>{{ param.defaultValue }}</code>.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
export interface Param {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
    defaultValue?: string | number | boolean;
}

interface Props {
    params: Param[];
}

defineProps<Props>();
</script>

<style scoped>
.param-list {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
    border-left: 2px solid #e5e7eb;
}

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
    left: -2.05rem;
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
</style>