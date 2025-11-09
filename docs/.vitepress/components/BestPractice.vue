<template>
    <div class="best-practice">
        <div class="practice-header">
            <div class="practice-icon-wrapper">
                <svg class="practice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
            </div>
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
    border-radius: 12px;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.best-practice:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
}

.practice-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: linear-gradient(90deg, #059669 0%, #10b981 100%);
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
    position: relative;
    overflow: hidden;
}

.practice-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #047857, #10b981, #047857);
    background-size: 200% 100%;
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}

.practice-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    padding: 0.25rem;
}

.practice-icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
}

.practice-body {
    padding: 1.5rem;
    color: #064e3b;
    line-height: 1.7;
    font-size: 0.95rem;
}

.practice-body :deep(code) {
    background-color: rgba(209, 250, 229, 0.7);
    color: #065f46;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    border: 1px solid rgba(16, 185, 129, 0.2);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.practice-body :deep(pre) {
    background-color: rgba(209, 250, 229, 0.7);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.75rem 0;
    border: 1px solid rgba(16, 185, 129, 0.2);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

.practice-body :deep(a) {
    color: #047857;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.practice-body :deep(a:hover) {
    color: #065f46;
    text-decoration: underline;
}

.dark .best-practice {
    background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark .best-practice:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.dark .practice-header {
    background: linear-gradient(90deg, #047857 0%, #059669 100%);
}

.dark .practice-icon-wrapper {
    background-color: rgba(255, 255, 255, 0.15);
}

.dark .practice-body {
    color: #d1fae5;
}

.dark .practice-body :deep(code) {
    background-color: rgba(6, 95, 70, 0.4);
    color: #a7f3d0;
    border-color: rgba(16, 185, 129, 0.3);
}

.dark .practice-body :deep(pre) {
    background-color: rgba(6, 95, 70, 0.4);
    color: #d1fae5;
    border-color: rgba(16, 185, 129, 0.3);
}

.dark .practice-body :deep(a) {
    color: #6ee7b7;
}

.dark .practice-body :deep(a:hover) {
    color: #a7f3d0;
}

@media (prefers-color-scheme: dark) {
    :root:not(.light) .best-practice {
        background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    :root:not(.light) .best-practice:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
    }

    :root:not(.light) .practice-header {
        background: linear-gradient(90deg, #047857 0%, #059669 100%);
    }

    :root:not(.light) .practice-icon-wrapper {
        background-color: rgba(255, 255, 255, 0.15);
    }

    :root:not(.light) .practice-body {
        color: #d1fae5;
    }

    :root:not(.light) .practice-body :deep(code) {
        background-color: rgba(6, 95, 70, 0.4);
        color: #a7f3d0;
        border-color: rgba(16, 185, 129, 0.3);
    }

    :root:not(.light) .practice-body :deep(pre) {
        background-color: rgba(6, 95, 70, 0.4);
        color: #d1fae5;
        border-color: rgba(16, 185, 129, 0.3);
    }

    :root:not(.light) .practice-body :deep(a) {
        color: #6ee7b7;
    }

    :root:not(.light) .practice-body :deep(a:hover) {
        color: #a7f3d0;
    }
}
</style>