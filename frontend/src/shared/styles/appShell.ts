/** App shell layout tokens — sidebar, topbar, main canvas */

export const sidebarWidthClass = 'w-[260px]'

export const appShellMainClass =
  'min-h-0 flex-1 overflow-y-auto bg-background'

export const appShellCanvasClass =
  'relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8'

export const appTopBarClass =
  'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-card/80 px-4 backdrop-blur-md sm:h-16 sm:px-6'

export const navItemActiveClass =
  'bg-accent text-accent-foreground font-medium'

export const navItemInactiveClass =
  'text-muted-foreground hover:bg-muted hover:text-foreground'

export const statCardClass =
  'group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5'
