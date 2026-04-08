/**
 * Wavex — React Components (CDN, no build)
 * يشتغل جنب vanilla JS بدون ما يكسر أي حاجة
 */

// ══════════════════════════════════════════════════
//  HELPERS — bridge بين React و vanilla JS
// ══════════════════════════════════════════════════
const WavexBridge = {
  getMe: () => {
    try { return JSON.parse(localStorage.getItem('wvx_me') || 'null'); } catch { return null; }
  },
  getPosts: () => {
    try { return JSON.parse(localStorage.getItem('wvx_posts') || '[]'); } catch { return []; }
  },
  getLang: () => localStorage.getItem('wvx_lang') || 'ar',

  // يراقب التغييرات كل ثانية
  useWatcher: (key, defaultVal, interval = 1200) => {
    const [val, setVal] = React.useState(defaultVal);
    React.useEffect(() => {
      const id = setInterval(() => {
        try {
          const raw = localStorage.getItem(key);
          const parsed = raw ? JSON.parse(raw) : defaultVal;
          setVal(prev => JSON.stringify(prev) !== JSON.stringify(parsed) ? parsed : prev);
        } catch {}
      }, interval);
      return () => clearInterval(id);
    }, [key]);
    return val;
  },

  toast: (msg, icon = '✨') => {
    if (typeof window.showToast === 'function') window.showToast(msg, icon);
  },
};

// ══════════════════════════════════════════════════
//  COMPONENT 1: Live Stats Widget (Right Panel)
// ══════════════════════════════════════════════════
function StatsWidget() {
  const lang  = WavexBridge.getLang();
  const isAr  = lang === 'ar';
  const posts = WavexBridge.useWatcher('wvx_posts', []);
  const users = WavexBridge.useWatcher('wvx_users', []);
  const me    = WavexBridge.getMe();

  const myPosts    = posts.filter(p => p.authorId === me?.id);
  const totalRx    = myPosts.reduce((sum, p) => {
    return sum + Object.values(p.reactions || {}).length;
  }, 0);
  const totalCmts  = myPosts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  const stats = [
    { icon: '📝', label: isAr ? 'منشوراتي' : 'My Posts',    val: myPosts.length },
    { icon: '🔥', label: isAr ? 'تفاعلاتي'  : 'Reactions',  val: totalRx },
    { icon: '💬', label: isAr ? 'تعليقاتي'  : 'Comments',   val: totalCmts },
    { icon: '👥', label: isAr ? 'المستخدمون': 'Users',       val: users.length },
  ];

  return React.createElement('div', { style: { padding: '4px 0' } },
    React.createElement('h3', {
      className: 'widget-title',
      style: { marginBottom: 12 }
    }, '⚡ ', isAr ? 'إحصائياتي' : 'My Stats'),
    React.createElement('div', {
      style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }
    },
      stats.map(s =>
        React.createElement('div', {
          key: s.label,
          style: {
            background: 'rgba(110,231,247,0.06)',
            border: '1px solid rgba(110,231,247,0.12)',
            borderRadius: 12,
            padding: '10px 12px',
            textAlign: 'center',
            transition: 'all .25s',
            cursor: 'default',
          },
          onMouseEnter: e => {
            e.currentTarget.style.background = 'rgba(110,231,247,0.12)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          },
          onMouseLeave: e => {
            e.currentTarget.style.background = 'rgba(110,231,247,0.06)';
            e.currentTarget.style.transform = 'none';
          },
        },
          React.createElement('div', { style: { fontSize: '1.3rem', marginBottom: 4 } }, s.icon),
          React.createElement('div', {
            style: {
              fontSize: '1.3rem', fontWeight: 800,
              background: 'linear-gradient(135deg,#6ee7f7,#a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }
          }, s.val),
          React.createElement('div', {
            style: { fontSize: '.68rem', color: 'var(--text-muted)', marginTop: 2 }
          }, s.label)
        )
      )
    )
  );
}

// ══════════════════════════════════════════════════
//  COMPONENT 2: Mood Picker Widget
// ══════════════════════════════════════════════════
function MoodWidget() {
  const lang = WavexBridge.getLang();
  const isAr = lang === 'ar';
  const [mood, setMood] = React.useState(() => localStorage.getItem('wvx_mood') || null);
  const [pulse, setPulse] = React.useState(false);

  const moods = [
    { emoji:'😊', label: isAr?'سعيد':'Happy',     color:'#34d399' },
    { emoji:'🔥', label: isAr?'متحمس':'Excited',   color:'#fb923c' },
    { emoji:'😴', label: isAr?'متعب':'Tired',      color:'#a78bfa' },
    { emoji:'🎵', label: isAr?'موسيقى':'Groovy',   color:'#6ee7f7' },
    { emoji:'💭', label: isAr?'مفكر':'Thoughtful', color:'#f472b6' },
    { emoji:'🌊', label: isAr?'هادئ':'Calm',       color:'#38bdf8' },
  ];

  function pickMood(m) {
    setMood(m.emoji);
    localStorage.setItem('wvx_mood', m.emoji);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    WavexBridge.toast(
      isAr ? `مزاجك الآن: ${m.label}` : `Mood: ${m.label}`,
      m.emoji
    );
  }

  return React.createElement('div', null,
    React.createElement('h3', { className: 'widget-title', style: { marginBottom: 10 } },
      '🎭 ', isAr ? 'كيف مزاجك؟' : 'Your Mood'
    ),
    mood && React.createElement('div', {
      style: {
        textAlign: 'center', fontSize: '2.2rem', marginBottom: 10,
        animation: pulse ? 'popIn .4s cubic-bezier(.16,1,.3,1)' : 'none',
      }
    }, mood),
    React.createElement('div', {
      style: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }
    },
      moods.map(m =>
        React.createElement('button', {
          key: m.emoji,
          onClick: () => pickMood(m),
          title: m.label,
          style: {
            background: mood === m.emoji
              ? `rgba(${hexToRgb(m.color)}, 0.2)`
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${mood === m.emoji ? m.color + '55' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 20,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all .2s cubic-bezier(.16,1,.3,1)',
            transform: mood === m.emoji ? 'scale(1.12)' : 'scale(1)',
          },
          onMouseEnter: e => { e.currentTarget.style.transform = 'scale(1.15) translateY(-2px)'; },
          onMouseLeave: e => { e.currentTarget.style.transform = mood === m.emoji ? 'scale(1.12)' : 'scale(1)'; },
        }, m.emoji)
      )
    )
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ══════════════════════════════════════════════════
//  COMPONENT 3: Smart Suggestions Bar (under composer)
// ══════════════════════════════════════════════════
function SuggestionsBar() {
  const lang = WavexBridge.getLang();
  const isAr = lang === 'ar';
  const [visible, setVisible] = React.useState(true);

  const suggestions = isAr ? [
    '🌊 شاركنا شيئاً جميلاً اليوم',
    '🎵 ما أغنيتك المفضلة الآن؟',
    '💭 ما أكثر شيء يشغل تفكيرك؟',
    '🔥 شيء تعلمته مؤخراً',
    '🌟 اذكر شخصاً أثّر في حياتك',
  ] : [
    '🌊 Share something beautiful today',
    '🎵 What\'s your favorite song right now?',
    '💭 What\'s on your mind?',
    '🔥 Something you learned recently',
    '🌟 Tag someone who inspires you',
  ];

  const [idx, setIdx] = React.useState(0);

  function useSuggestion(text) {
    const clean = text.replace(/^[^\s]+\s/, '');
    const ta = document.getElementById('post-content');
    if (ta) {
      ta.value = clean;
      ta.dispatchEvent(new Event('input'));
      ta.focus();
    }
    setVisible(false);
    setTimeout(() => setVisible(true), 8000);
  }

  if (!visible) return null;

  return React.createElement('div', {
    style: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 4px 0', flexWrap: 'wrap',
    }
  },
    React.createElement('span', {
      style: { fontSize: '.72rem', color: 'var(--text-muted)', flexShrink: 0 }
    }, isAr ? 'اقتراح:' : 'Try:'),
    suggestions.map((s, i) =>
      React.createElement('button', {
        key: i,
        onClick: () => useSuggestion(s),
        style: {
          background: 'rgba(110,231,247,0.06)',
          border: '1px solid rgba(110,231,247,0.15)',
          borderRadius: 14,
          padding: '3px 10px',
          fontSize: '.75rem',
          color: 'var(--text-sub)',
          cursor: 'pointer',
          transition: 'all .2s',
          whiteSpace: 'nowrap',
        },
        onMouseEnter: e => {
          e.currentTarget.style.background = 'rgba(110,231,247,0.14)';
          e.currentTarget.style.color = 'var(--accent)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        },
        onMouseLeave: e => {
          e.currentTarget.style.background = 'rgba(110,231,247,0.06)';
          e.currentTarget.style.color = 'var(--text-sub)';
          e.currentTarget.style.transform = 'none';
        },
      }, s)
    )
  );
}

// ══════════════════════════════════════════════════
//  COMPONENT 4: Floating Action Button (FAB)
// ══════════════════════════════════════════════════
function FloatingFAB() {
  const lang = WavexBridge.getLang();
  const isAr = lang === 'ar';
  const [open, setOpen] = React.useState(false);
  const [pulse, setPulse] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const actions = [
    { icon:'📸', label: isAr?'صورة':'Photo',   action: () => document.getElementById('image-upload')?.click() },
    { icon:'🎬', label: isAr?'فيديو':'Video',  action: () => document.getElementById('video-upload')?.click() },
    { icon:'🎵', label: isAr?'صوت':'Audio',    action: () => document.getElementById('audio-upload')?.click() },
    { icon:'📖', label: isAr?'قصة':'Story',    action: () => typeof window.addStory === 'function' && window.addStory() },
  ];

  const fabStyle = {
    position: 'fixed',
    bottom: 88,
    [isAr ? 'left' : 'right']: 20,
    zIndex: 888,
    display: 'flex',
    flexDirection: 'column-reverse',
    alignItems: 'center',
    gap: 10,
  };

  const btnStyle = {
    width: 52, height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#6ee7f7,#a78bfa)',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    boxShadow: pulse
      ? '0 0 0 0 rgba(110,231,247,0.6), 0 6px 24px rgba(110,231,247,0.4)'
      : '0 6px 24px rgba(110,231,247,0.35)',
    animation: pulse ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
    transition: 'all .3s cubic-bezier(.16,1,.3,1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transform: open ? 'rotate(45deg)' : 'rotate(0)',
  };

  return React.createElement('div', { style: fabStyle },
    // Main FAB button
    React.createElement('button', {
      style: btnStyle,
      onClick: () => { setOpen(v => !v); setPulse(false); },
      title: isAr ? 'إنشاء' : 'Create',
    }, open ? '✕' : '✨'),

    // Sub-action buttons
    open && actions.map((a, i) =>
      React.createElement('div', {
        key: a.label,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexDirection: isAr ? 'row' : 'row-reverse',
          animation: `cardIn .3s cubic-bezier(.16,1,.3,1) ${i * 0.05}s both`,
        }
      },
        React.createElement('span', {
          style: {
            background: 'rgba(13,13,31,.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: '.78rem',
            color: 'var(--text-sub)',
            whiteSpace: 'nowrap',
          }
        }, a.label),
        React.createElement('button', {
          style: {
            width: 42, height: 42,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          },
          onClick: () => { a.action(); setOpen(false); },
          onMouseEnter: e => { e.currentTarget.style.background = 'rgba(110,231,247,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; },
          onMouseLeave: e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; },
        }, a.icon)
      )
    )
  );
}

// ══════════════════════════════════════════════════
//  COMPONENT 5: Live Notification Pulse
// ══════════════════════════════════════════════════
function NotifCenter() {
  const notifs = WavexBridge.useWatcher('wvx_notifs', [], 2000);
  const lang = WavexBridge.getLang();
  const isAr = lang === 'ar';
  const [seen, setSeen] = React.useState(() => {
    return parseInt(localStorage.getItem('wvx_react_notif_seen') || '0');
  });

  const unseen = notifs.filter((n, i) => i >= seen).length;

  React.useEffect(() => {
    // Update unseen badge on the nav item too (vanilla JS sync)
    const badge = document.querySelector('#nav-notifications .notif-badge');
    if (badge && unseen > 0) badge.textContent = unseen > 9 ? '9+' : unseen;
  }, [unseen]);

  return null; // Invisible — just syncs state
}

// ══════════════════════════════════════════════════
//  MOUNT ALL COMPONENTS
// ══════════════════════════════════════════════════
function mountReactComponents() {
  const mounts = [
    { id: 'react-stats-widget',     Component: StatsWidget      },
    { id: 'react-mood-widget',      Component: MoodWidget       },
    { id: 'react-suggestions-bar',  Component: SuggestionsBar   },
    { id: 'react-fab',              Component: FloatingFAB      },
    { id: 'react-notif-center',     Component: NotifCenter      },
  ];

  mounts.forEach(({ id, Component }) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const root = ReactDOM.createRoot(el);
      root.render(React.createElement(Component));
    } catch(e) {
      console.warn(`React mount failed for #${id}:`, e);
    }
  });

  console.log('⚛️ Wavex React components mounted successfully');
}

// Mount بعد ما الـ app يشتغل
function waitForApp() {
  const app = document.getElementById('app');
  if (app && !app.classList.contains('hidden')) {
    mountReactComponents();
  } else {
    // راقب حتى يظهر الـ app
    const obs = new MutationObserver(() => {
      if (app && !app.classList.contains('hidden')) {
        obs.disconnect();
        setTimeout(mountReactComponents, 300);
      }
    });
    if (app) obs.observe(app, { attributes: true, attributeFilter: ['class'] });
    else setTimeout(waitForApp, 500);
  }
}

// ابدأ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForApp);
} else {
  waitForApp();
}

// Re-mount لو المستخدم سجل دخول
window.addEventListener('wavex-login', () => {
  setTimeout(mountReactComponents, 400);
});
