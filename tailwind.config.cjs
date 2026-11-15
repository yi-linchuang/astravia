
const hv = n => `hsl(var(--${n}) / <alpha-value>)`;
module.exports = { content: ['./index.html', './src/**/*.js'], future: { hoverOnlyWhenSupported: true }, theme: { extend: {
  fontFamily: { sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['IBM Plex Mono', 'ui-monospace', 'Menlo', 'monospace'] },
  colors: { ground: hv('ground'), background: hv('background'), foreground: hv('foreground'), card: hv('card'),
    border: hv('border'), ring: hv('ring'), chart: hv('chart'),
    muted: { DEFAULT: hv('muted'), foreground: hv('muted-foreground') },
    primary: { DEFAULT: hv('primary'), foreground: hv('primary-foreground') },
    ok: { DEFAULT: hv('ok'), soft: hv('ok-soft') }, warn: { DEFAULT: hv('warn'), soft: hv('warn-soft') },
    alert: { DEFAULT: hv('alert'), soft: hv('alert-soft') }, info: { DEFAULT: hv('info'), soft: hv('info-soft') } },
  borderRadius: { lg: '0.5rem', md: '0.375rem', xl: '0.75rem' } } } };
