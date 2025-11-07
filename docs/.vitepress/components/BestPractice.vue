<template>
    <div class="best-practice">
        <div class="practice-header">
            <svg class="practice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            <span class="practice-title">Best Practice</span>
        </div>
        <div class="practice-body">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.best-practice {
    margin: 2rem 0;
    border: 1px solid #a7f3d0;
    border-radius: 8px;
    background-color: #ecfdf5;
    overflow: hidden;
}

.practice-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background-color: #10b981;
    color: white;
    font-weight: 600;
    font-size: 1rem;
}

.practice-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
}

.practice-body {
    padding: 1.25rem;
    color: #064e3b;
    line-height: 1.7;
}


.practice-body :deep(code) {
    background-color: #d1fae5;
    color: #065f46;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875em;
}

.practice-body :deep(pre) {
    background-color: #d1fae5;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
}

.practice-body :deep(p) {
    margin-bottom: 1rem;
}

.practice-body :deep(p:last-child) {
    margin-bottom: 0;
}

.practice-body :deep(ul),
.practice-body :deep(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
}

.practice-body :deep(li) {
    margin-bottom: 0.5rem;
}
</style>